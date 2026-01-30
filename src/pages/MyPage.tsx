import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProducts, deleteProduct, markProductAsSold, markProductAsActive } from '../lib/products';
import { deleteProductImage } from '../lib/storage';
import { getUserAverageRating, getUserReviews } from '../lib/reviews';
import { getProfile } from '../lib/profiles';
import type { Product, Review, Profile } from '../types/database.types';
import ProfileEditModal from '../components/ProfileEditModal';

type User = {
  id: string;
  email?: string;
  created_at?: string;
};

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

// 리뷰 아이템 컴포넌트
function ReviewItem({ review }: { review: Review }) {
  const [reviewerNickname, setReviewerNickname] = useState<string>('');

  useEffect(() => {
    if (!review.is_anonymous) {
      getProfile(review.reviewer_id)
        .then((profile) => setReviewerNickname(profile?.nickname || '사용자'))
        .catch(() => setReviewerNickname('사용자'));
    }
  }, [review]);

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">
            {'⭐'.repeat(review.rating)}
          </span>
          <span className="text-sm font-medium text-gray-700">
            {review.is_anonymous ? '익명' : reviewerNickname}
          </span>
          <span className="text-sm text-gray-500">
            {new Date(review.created_at).toLocaleDateString('ko-KR')}
          </span>
        </div>
      </div>
      {review.comment && (
        <p className="text-gray-700 whitespace-pre-wrap">{review.comment}</p>
      )}
    </div>
  );
}

export default function MyPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'sold' | 'reviews'>('active');
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserData = () => {
      // localStorage에서 직접 세션 가져오기
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
      const key = `sb-${projectRef}-auth-token`;
      const sessionStr = localStorage.getItem(key);
      
      if (!sessionStr) {
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }
      
      try {
        const session = JSON.parse(sessionStr);
        const user = session?.user;

        if (!user) {
          navigate('/login');
          return;
        }

        setUser(user);

        // 프로필 정보 로드 (.then() 방식)
        getProfile(user.id)
          .then(userProfile => {
            if (userProfile) {
              setProfile(userProfile);
            }
          })
          .catch(error => console.error('프로필 로딩 실패:', error));

        // 상품 목록 로드
        getUserProducts(user.id)
          .then(userProducts => setProducts(userProducts))
          .catch(error => console.error('상품 목록 로딩 실패:', error));

        // 평점 로드
        getUserAverageRating(user.id)
          .then(rating => {
            setAverageRating(rating.average);
            setReviewCount(rating.count);
          })
          .catch(error => console.error('평점 로딩 실패:', error));

        // 리뷰 목록 로드
        getUserReviews(user.id)
          .then(userReviews => setReviews(userReviews))
          .catch(error => console.error('리뷰 목록 로딩 실패:', error));

        setLoading(false);
      } catch (error) {
        console.error('세션 파싱 실패:', error);
        navigate('/login');
      }
    };

    loadUserData();
  }, [navigate]);

  const activeProducts = products.filter((p) => p.status === 'active');
  const soldProducts = products.filter((p) => p.status === 'sold');

  const handleDeleteProduct = (product: Product) => {
    if (!confirm('정말 이 상품을 삭제하시겠습니까?')) return;

    // 이미지가 있으면 먼저 삭제
    const deleteImagePromise = product.image_url 
      ? deleteProductImage(product.image_url) 
      : Promise.resolve();

    deleteImagePromise
      .then(() => deleteProduct(product.id))
      .then(() => {
        // 목록에서 제거
        setProducts(products.filter((p) => p.id !== product.id));
        alert('상품이 삭제되었습니다.');
      })
      .catch(error => {
        console.error('상품 삭제 실패:', error);
        alert('상품 삭제에 실패했습니다.');
      });
  };

  const handleToggleProductStatus = (product: Product) => {
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
        // 목록 업데이트
        setProducts(products.map((p) => 
          p.id === product.id ? updatedProduct : p
        ));
        alert(newStatus === 'sold' ? '판매완료 처리되었습니다.' : '판매중으로 변경되었습니다.');
      })
      .catch(error => {
        console.error('상태 변경 실패:', error);
        alert('상태 변경에 실패했습니다.');
      });
  };


  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">내 상점</h1>
        
        {/* 프로필 카드 */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.nickname}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl">👤</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold mb-2">{profile?.nickname}</h2>
              {profile?.bio && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{profile.bio}</p>
              )}
              <div className="flex gap-4 text-sm text-gray-600 flex-wrap">
                {profile?.email_public !== false && <span>{profile?.email}</span>}
                {profile?.email_public !== false && <span>•</span>}
                <span>가입일: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ko-KR') : '-'}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex-shrink-0"
            >
              프로필 수정
            </button>
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <p className="text-2xl font-bold text-orange-500">{activeProducts.length}</p>
            <p className="text-sm text-gray-600 mt-1">판매중</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <p className="text-2xl font-bold text-blue-500">{soldProducts.length}</p>
            <p className="text-sm text-gray-600 mt-1">거래완료</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl font-bold text-yellow-500">{averageRating}</span>
              <span className="text-yellow-500">⭐</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">평균 평점</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <p className="text-2xl font-bold text-purple-500">{reviewCount}</p>
            <p className="text-sm text-gray-600 mt-1">리뷰</p>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b">
            <div className="flex">
              <button 
                onClick={() => setActiveTab('active')}
                className={`px-6 py-4 font-semibold ${
                  activeTab === 'active'
                    ? 'text-orange-500 border-b-2 border-orange-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                판매중인 상품
              </button>
              <button 
                onClick={() => setActiveTab('sold')}
                className={`px-6 py-4 font-semibold ${
                  activeTab === 'sold'
                    ? 'text-orange-500 border-b-2 border-orange-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                거래완료
              </button>
              <button 
                onClick={() => setActiveTab('reviews')}
                className={`px-6 py-4 font-semibold ${
                  activeTab === 'reviews'
                    ? 'text-orange-500 border-b-2 border-orange-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                받은 리뷰
              </button>
            </div>
          </div>
          
          <div className="p-8">
            {activeTab === 'reviews' ? (
              // 리뷰 탭
              reviews.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-6xl mb-4 block">⭐</span>
                  <p className="text-gray-500">아직 받은 리뷰가 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <ReviewItem key={review.id} review={review} />
                  ))}
                </div>
              )
            ) : (activeTab === 'active' ? activeProducts : soldProducts).length === 0 ? (
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">📦</span>
                <p className="text-gray-500">
                  {activeTab === 'active' ? '아직 등록한 상품이 없습니다.' : '거래완료된 상품이 없습니다.'}
                </p>
                {activeTab === 'active' && (
                  <button 
                    onClick={() => navigate('/write')}
                    className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    상품 등록하기
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(activeTab === 'active' ? activeProducts : soldProducts).map((product) => (
                  <div
                    key={product.id}
                    className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* 상품 이미지 */}
                    <div className="bg-gray-100 h-48 flex items-center justify-center text-gray-400 relative group">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.title}
                          className={`w-full h-full object-cover ${
                            product.status === 'sold' ? 'opacity-50' : ''
                          }`}
                        />
                      ) : (
                        <span className="text-4xl">📦</span>
                      )}
                      {product.status === 'sold' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="bg-gray-900 bg-opacity-75 text-white px-4 py-2 rounded-lg font-semibold">
                            판매완료
                          </span>
                        </div>
                      )}
                      {/* 버튼들 */}
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleProductStatus(product);
                          }}
                          className={`${
                            product.status === 'active'
                              ? 'bg-green-500 hover:bg-green-600'
                              : 'bg-blue-500 hover:bg-blue-600'
                          } text-white px-3 py-1 rounded-lg text-sm`}
                        >
                          {product.status === 'active' ? '판매완료' : '판매중'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProduct(product);
                          }}
                          className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                    
                    {/* 상품 정보 */}
                    <div className="p-3">
                      <h3 className="text-sm font-medium mb-2 line-clamp-2 min-h-[40px]">
                        {product.title}
                      </h3>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-base font-bold">
                          {product.price.toLocaleString()}원
                        </p>
                        <p className="text-xs text-gray-500">
                          {getTimeAgo(product.created_at)}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">{product.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ProfileEditModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        profile={profile}
        userId={user?.id ?? ''}
      />
    </div>
  );
}
