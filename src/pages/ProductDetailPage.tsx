import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct, markProductAsSold, markProductAsActive } from '../lib/products';
import { getOrCreateChatRoom } from '../lib/chat';
import { getUserAverageRating } from '../lib/reviews';
import { getProfile } from '../lib/profiles';
import type { Product } from '../types/database.types';

// 시간 차이를 계산하는 함수
function getTimeAgo(dateString: string) {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return '방금 전';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}일 전`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}개월 전`;
  return `${Math.floor(diffInSeconds / 31536000)}년 전`;
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [sellerRating, setSellerRating] = useState({ average: 0, count: 0 });
  const [sellerNickname, setSellerNickname] = useState<string>('');

  useEffect(() => {
    if (!id) return;

    const loadProduct = () => {
      // localStorage에서 사용자 가져오기
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
      const key = `sb-${projectRef}-auth-token`;
      const sessionStr = localStorage.getItem(key);
      const user = sessionStr ? JSON.parse(sessionStr)?.user : null;
      
      if (user) {
        setCurrentUserId(user.id);
      }

      // 상품 정보 로드 (.then() 방식)
      getProduct(id)
        .then(data => {
          setProduct(data);

          // 판매자 평점 가져오기
          getUserAverageRating(data.user_id)
            .then(rating => setSellerRating(rating))
            .catch(error => console.error('평점 로딩 실패:', error));

          // 판매자 닉네임 가져오기
          getProfile(data.user_id)
            .then(sellerProfile => setSellerNickname(sellerProfile?.nickname || '판매자'))
            .catch(error => console.error('프로필 로딩 실패:', error));

          setLoading(false);
        })
        .catch(error => {
          console.error('상품 로딩 실패:', error);
          alert('상품을 찾을 수 없습니다.');
          navigate('/');
        });
    };

    loadProduct();
  }, [id, navigate]);

  const handleStartChat = () => {
    if (!product) return;

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

    if (user.id === product.user_id) {
      alert('자신의 상품에는 채팅할 수 없습니다.');
      return;
    }

    console.log('💬 채팅방 생성 또는 이동...');
    
    getOrCreateChatRoom(product.id, product.user_id)
      .then(room => {
        console.log('✅ 채팅방:', room.id);
        navigate(`/chat/${room.id}`);
      })
      .catch((error: any) => {
        console.error('❌ 채팅방 생성 실패:', error);
        alert(error.message || '채팅방 생성에 실패했습니다.');
      });
  };

  const handleToggleStatus = () => {
    if (!product) return;

    const newStatus = product.status === 'active' ? 'sold' : 'active';
    const confirmMessage = newStatus === 'sold' 
      ? '이 상품을 판매완료 처리하시겠습니까?' 
      : '이 상품을 다시 판매중으로 변경하시겠습니까?';
    
    if (!confirm(confirmMessage)) return;

    const updatePromise = newStatus === 'sold'
      ? markProductAsSold(product.id)
      : markProductAsActive(product.id);

    updatePromise
      .then(updatedProduct => {
        setProduct(updatedProduct);
        alert(newStatus === 'sold' ? '판매완료 처리되었습니다.' : '판매중으로 변경되었습니다.');
      })
      .catch(error => {
        console.error('상태 변경 실패:', error);
        alert('상태 변경에 실패했습니다.');
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            {/* 이미지 영역 */}
            <div className="bg-gray-100 rounded-lg flex items-center justify-center min-h-[400px]">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.title}
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <span className="text-8xl">📦</span>
              )}
            </div>

            {/* 상품 정보 영역 */}
            <div className="flex flex-col">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-4">{product.title}</h1>
                
                <div className="mb-6">
                  <p className="text-4xl font-bold text-orange-500 mb-2">
                    {product.price.toLocaleString()}원
                  </p>
                  <p className="text-sm text-gray-500">
                    {getTimeAgo(product.created_at)} · {product.location}
                  </p>
                </div>

                {/* 판매자 정보 */}
                <div className="border-t pt-6 mb-6">
                  <h2 className="text-lg font-semibold mb-3">판매자 정보</h2>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">👤</span>
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{sellerNickname}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-500">⭐ {sellerRating.average}</span>
                        <span className="text-sm text-gray-500">
                          ({sellerRating.count}개의 리뷰)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6 mb-6">
                  <h2 className="text-lg font-semibold mb-3">상품 설명</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">{product.content}</p>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                  <span className={`px-3 py-1 rounded-full ${
                    product.status === 'active' ? 'bg-green-100 text-green-700' :
                    product.status === 'reserved' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {product.status === 'active' ? '판매중' :
                     product.status === 'reserved' ? '예약중' : '거래완료'}
                  </span>
                </div>
              </div>

              {/* 버튼 영역 */}
              <div className="flex gap-4">
                <button
                  onClick={() => navigate(-1)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  뒤로가기
                </button>
                {currentUserId === product.user_id ? (
                  // 본인 상품: 판매완료/판매중 토글 버튼
                  <button
                    onClick={handleToggleStatus}
                    className={`flex-1 px-6 py-3 rounded-lg text-white font-semibold ${
                      product.status === 'active'
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                  >
                    {product.status === 'active' ? '판매완료 처리' : '판매중으로 변경'}
                  </button>
                ) : (
                  // 다른 사람 상품: 채팅하기 버튼
                  <button
                    onClick={handleStartChat}
                    disabled={product.status === 'sold'}
                    className={`flex-1 px-6 py-3 rounded-lg font-semibold ${
                      product.status === 'sold'
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-orange-500 text-white hover:bg-orange-600'
                    }`}
                  >
                    {product.status === 'sold' ? '판매완료된 상품' : '채팅하기'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
