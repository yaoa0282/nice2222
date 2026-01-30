import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyChatRooms } from '../lib/chat';
import type { ChatRoomWithDetails } from '../types/database.types';

// 시간 차이를 계산하는 함수
function getTimeAgo(dateString: string) {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return '방금 전';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}일 전`;
  return `${Math.floor(diffInSeconds / 2592000)}개월 전`;
}

export default function ChatListPage() {
  const navigate = useNavigate();
  const [chatRooms, setChatRooms] = useState<ChatRoomWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndLoadChats();
  }, []);

  const checkAuthAndLoadChats = () => {
    console.log('🔵 채팅 목록 페이지 로딩 시작');
    
    // localStorage에서 직접 세션 가져오기
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
    const key = `sb-${projectRef}-auth-token`;
    const sessionStr = localStorage.getItem(key);
    
    if (!sessionStr) {
      console.error('❌ 세션 없음');
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    
    try {
      const session = JSON.parse(sessionStr);
      const user = session?.user;
      
      if (!user) {
        console.error('❌ 유저 없음');
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      console.log('✅ 유저 확인:', user.id);
      loadChatRooms();
    } catch (error) {
      console.error('❌ 세션 파싱 실패:', error);
      alert('세션 오류가 발생했습니다.');
      navigate('/login');
    }
  };

  const loadChatRooms = () => {
    console.log('📦 채팅방 목록 로딩 시작...');
    
    getMyChatRooms()
      .then(rooms => {
        console.log('✅ 채팅방 로딩 완료:', rooms.length);
        setChatRooms(rooms);
        setLoading(false);
      })
      .catch(error => {
        console.error('❌ 채팅방 목록 로딩 실패:', error);
        console.error('❌ 에러 상세:', error.message);
        alert('채팅 목록을 불러올 수 없습니다.');
        setLoading(false);
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">채팅</h1>

        {chatRooms.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <span className="text-6xl mb-4 block">💬</span>
            <p className="text-gray-500">아직 채팅 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm divide-y">
            {chatRooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => navigate(`/chat/${room.id}`)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex gap-4">
                    {/* 상품 이미지 */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                      {room.product?.image_url ? (
                        <img
                          src={room.product.image_url}
                          alt={room.product.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span className="text-2xl">📦</span>
                      )}
                    </div>

                    {/* 채팅 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold truncate">
                          {room.product?.title}
                        </h3>
                        {room.last_message && (
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {getTimeAgo(room.last_message.created_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate mb-1">
                        {room.last_message?.message || '메시지가 없습니다.'}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {room.product?.price.toLocaleString()}원
                        </span>
                        {room.unread_count! > 0 && (
                          <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {room.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
