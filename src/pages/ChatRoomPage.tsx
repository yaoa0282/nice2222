import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getChatMessages,
  sendMessage,
  markMessagesAsRead,
  confirmSaleInRoom,
} from '../lib/chat';
import { getProduct } from '../lib/products';
import { getProductReview } from '../lib/reviews';
import ReviewModal from '../components/ReviewModal';
import type { ChatMessage, ChatRoom, Product } from '../types/database.types';

export default function ChatRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [otherUserId, setOtherUserId] = useState<string>('');
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [confirmingSale, setConfirmingSale] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 디버깅: hasReviewed 상태 변경 감지
  useEffect(() => {
    console.log('🔄 hasReviewed 상태 변경:', hasReviewed);
  }, [hasReviewed]);

  // 디버깅: product 상태 변경 감지
  useEffect(() => {
    console.log('🔄 product 상태 변경:', product?.title, product?.status);
  }, [product]);

  useEffect(() => {
    if (!roomId) return;
    
    checkAuthAndLoadData();
    
    // 실시간 메시지 폴링 (3초마다) - .then() 방식
    const pollInterval = setInterval(() => {
      // 창이 활성화되어 있을 때만 폴링
      if (!document.hidden) {
        getChatMessages(roomId)
          .then(allMessages => {
            setMessages((prev) => {
              // 메시지 개수나 마지막 메시지가 다를 때만 업데이트
              if (prev.length !== allMessages.length || 
                  (allMessages.length > 0 && prev[prev.length - 1]?.id !== allMessages[allMessages.length - 1]?.id)) {
                // 새 메시지가 있으면 읽음 처리
                markMessagesAsRead(roomId).catch(err => 
                  console.error('읽음 처리 실패:', err)
                );
                return allMessages;
              }
              return prev;
            });
          })
          .catch(error => console.error('메시지 폴링 실패:', error));
      }
    }, 3000);

    // cleanup
    return () => {
      clearInterval(pollInterval);
    };
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkAuthAndLoadData = () => {
    // localStorage에서 사용자 가져오기
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
    const key = `sb-${projectRef}-auth-token`;
    const sessionStr = localStorage.getItem(key);
    
    if (!sessionStr) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    
    const user = JSON.parse(sessionStr)?.user;
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    setCurrentUserId(user.id);
    loadChatData(user.id);
  };

  const loadChatData = (userId: string) => {
    if (!roomId) return;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
    const key = `sb-${projectRef}-auth-token`;
    const sessionStr = localStorage.getItem(key);
    const accessToken = sessionStr ? JSON.parse(sessionStr)?.access_token : supabaseKey;

    console.log('🔵 채팅방 데이터 로드 시작...', { roomId, userId });

    // 메시지 로드
    getChatMessages(roomId)
      .then(chatMessages => {
        console.log('✅ 메시지 로드:', chatMessages.length, '개');
        setMessages(chatMessages);
        // 읽음 처리
        markMessagesAsRead(roomId).catch(err => console.error('읽음 처리 실패:', err));
      })
      .catch(error => console.error('❌ 메시지 로딩 실패:', error));

    // 채팅방 정보 로드 (Fetch API with accessToken)
    console.log('🔑 Access Token 사용:', accessToken?.substring(0, 20) + '...');
    fetch(`${supabaseUrl}/rest/v1/chat_rooms?id=eq.${roomId}`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${accessToken}`,
      },
    })
      .then(response => {
        console.log('📡 채팅방 정보 응답:', response.status);
        return response.json();
      })
      .then(rooms => {
        console.log('📦 채팅방 데이터:', rooms);
        const roomData = rooms[0];
        if (roomData) setRoom(roomData as ChatRoom);

        if (roomData) {
          console.log('✅ 채팅방 ID:', roomData.id, '상품 ID:', roomData.product_id);
          // 상품 정보 로드
          getProduct(roomData.product_id)
            .then(productData => {
              console.log('📦 상품 데이터:', productData);
              setProduct(productData);

              // 상대방 ID 설정
              const other = userId === roomData.buyer_id ? roomData.seller_id : roomData.buyer_id;
              setOtherUserId(other);

              // 이 채팅방에서 판매확정된 경우에만 구매자에게 리뷰 허용
              const isConfirmedBuyer = roomData.sale_confirmed_at && roomData.buyer_id === userId;
              if (productData.status === 'sold' && isConfirmedBuyer) {
                console.log('✅ 판매확정 구매자 - 리뷰 확인 중...');
                getProductReview(roomData.product_id, userId)
                  .then(review => {
                    console.log('🔍 기존 리뷰:', review);
                    setHasReviewed(!!review);
                  })
                  .catch(error => {
                    console.log('❌ 리뷰 확인 실패:', error);
                    setHasReviewed(false);
                  });
              } else {
                setHasReviewed(false);
              }

              setLoading(false);
            })
            .catch(error => {
              console.error('❌ 상품 로딩 실패:', error);
              setLoading(false);
            });
        } else {
          console.log('⚠️ 채팅방을 찾을 수 없습니다.');
          setRoom(null);
          setLoading(false);
        }
      })
      .catch(error => {
        console.error('❌ 채팅방 정보 로딩 실패:', error);
        setLoading(false);
      });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const refreshMessages = () => {
    if (!roomId) return;
    
    console.log('🔄 메시지 새로고침...');
    
    getChatMessages(roomId)
      .then(allMessages => {
        console.log('✅ 메시지 로드:', allMessages.length);
        setMessages(allMessages);
        setTimeout(scrollToBottom, 100);
      })
      .catch(error => console.error('❌ 메시지 로딩 실패:', error));
  };

  const handleConfirmSale = () => {
    if (!roomId || !room || !product) return;
    if (product.user_id !== currentUserId) return;
    if (product.status === 'sold' || room.sale_confirmed_at) return;
    if (!confirm('이 채팅 상대에게 판매확정하시겠습니까? (이 분만 리뷰를 남길 수 있습니다)')) return;

    setConfirmingSale(true);
    confirmSaleInRoom(roomId)
      .then(() => {
        setProduct((prev) => (prev ? { ...prev, status: 'sold' } : null));
        setRoom((prev) => (prev ? { ...prev, sale_confirmed_at: new Date().toISOString() } : null));
        alert('판매확정되었습니다.');
      })
      .catch((err: unknown) => {
        alert(err instanceof Error ? err.message : '판매확정에 실패했습니다.');
      })
      .finally(() => setConfirmingSale(false));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !roomId) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    console.log('📤 메시지 전송:', messageText.substring(0, 20));

    sendMessage(roomId, messageText)
      .then(sentMessage => {
        console.log('✅ 메시지 전송 성공:', sentMessage);
        // 메시지 전송 후 즉시 새로고침
        refreshMessages();
      })
      .catch(error => {
        console.error('❌ 메시지 전송 실패:', error);
        alert('메시지 전송에 실패했습니다.');
        setNewMessage(messageText);
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <div className="bg-white border-b px-4 py-4 sticky top-16 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/chat')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← 뒤로
            </button>
            <button
              onClick={refreshMessages}
              className="text-orange-500 hover:text-orange-600 text-xl"
              title="메시지 새로고침"
            >
              🔄
            </button>
            {product && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-lg">📦</span>
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-sm">{product.title}</h2>
                  <p className="text-xs text-gray-600">
                    {product.price.toLocaleString()}원
                  </p>
                </div>
              </div>
            )}
          </div>
          {/* 판매확정 버튼: 판매자만, 상품이 판매중이고 이 채팅에서 아직 미확정일 때 */}
          {product && room && product.user_id === currentUserId && product.status === 'active' && !room.sale_confirmed_at && (
            <button
              type="button"
              onClick={handleConfirmSale}
              disabled={confirmingSale}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-semibold"
            >
              {confirmingSale ? '처리 중...' : '✓ 판매확정'}
            </button>
          )}
          {/* 리뷰 작성 버튼: 이 채팅에서 판매확정된 구매자만 */}
          {(() => {
            const isConfirmedBuyer = room?.sale_confirmed_at && room.buyer_id === currentUserId;
            const showButton = product && product.status === 'sold' && isConfirmedBuyer && !hasReviewed;
            return showButton ? (
              <button
                type="button"
                onClick={() => setShowReviewModal(true)}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm font-semibold"
              >
                ⭐ 리뷰 작성
              </button>
            ) : null;
          })()}
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p>첫 메시지를 보내보세요!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isMyMessage = message.sender_id === currentUserId;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2 rounded-lg ${
                        isMyMessage
                          ? 'bg-orange-500 text-white'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {message.message}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          isMyMessage ? 'text-orange-100' : 'text-gray-500'
                        }`}
                      >
                        {new Date(message.created_at).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* 입력 영역 */}
      <div className="bg-white border-t px-4 py-4 sticky bottom-0">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            전송
          </button>
        </form>
      </div>

      {/* 리뷰 작성 모달 */}
      {showReviewModal && product && (
        <ReviewModal
          productId={product.id}
          revieweeId={otherUserId}
          sellerId={product.user_id}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => {
            setHasReviewed(true);
            setShowReviewModal(false);
          }}
        />
      )}
    </div>
  );
}
