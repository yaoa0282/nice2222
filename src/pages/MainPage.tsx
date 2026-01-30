import { useEffect, useState, memo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { searchProducts } from '../lib/products';
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

const MainPage = memo(function MainPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const searchQuery = searchParams.get('search');

  useEffect(() => {
    console.log('🔵 MainPage useEffect 실행! searchQuery:', searchQuery);
    let isMounted = true;
    
    const loadProducts = async () => {
      try {
        console.log('📦 상품 로딩 시작, isMounted:', isMounted);
        if (!isMounted) return;
        
        // 테스트: 즉시 로딩 해제 (5초 후)
        setTimeout(() => {
          console.log('⏱️ 5초 타임아웃! 강제 로딩 해제');
          if (isMounted) {
            setLoading(false);
          }
        }, 5000);
        
        setLoading(true);

        if (searchQuery) {
          // 검색 모드 (Fetch API)
          console.log('🔍 Fetch API로 검색 중...');
          
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
          const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
          const key = `sb-${projectRef}-auth-token`;
          const sessionStr = localStorage.getItem(key);
          const accessToken = sessionStr ? JSON.parse(sessionStr)?.access_token : supabaseKey;
          
          const searchFilter = `title.ilike.*${searchQuery}*,content.ilike.*${searchQuery}*,location.ilike.*${searchQuery}*`;
          
          fetch(`${supabaseUrl}/rest/v1/products?or=(${searchFilter})&order=created_at.desc`, {
            method: 'GET',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          })
            .then(response => response.json())
            .then(data => {
              console.log('✅ 검색 완료:', data?.length);
              if (isMounted) {
                setProducts(data || []);
                setLoading(false);
              }
            })
            .catch(error => {
              console.error('❌ 검색 실패:', error);
              if (isMounted) {
                setProducts([]);
                setLoading(false);
              }
            });
          return;
        } else {
          // 전체 상품 가져오기 (Fetch API 직접 사용)
          console.log('📦 Fetch API로 상품 로딩 시작...');
          
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
          const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
          const key = `sb-${projectRef}-auth-token`;
          const sessionStr = localStorage.getItem(key);
          const accessToken = sessionStr ? JSON.parse(sessionStr)?.access_token : supabaseKey;
          
          fetch(`${supabaseUrl}/rest/v1/products?order=created_at.desc`, {
            method: 'GET',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          })
            .then(response => {
              console.log('✅ Fetch 응답 받음!', response.status);
              return response.json();
            })
            .then(data => {
              console.log('✅ 데이터 파싱 완료:', data?.length);
              if (isMounted) {
                setProducts(data || []);
                setLoading(false);
                console.log('✅ 로딩 완료!');
              }
            })
            .catch(error => {
              console.error('❌ Fetch 에러:', error);
              if (isMounted) {
                setProducts([]);
                setLoading(false);
              }
            });
          
          return;
        }
      } catch (error) {
        console.error('예외 발생:', error);
        if (isMounted) {
          setProducts([]);
          setLoading(false);
        }
      }
    };

    loadProducts();
    
    return () => {
      console.log('🧹 MainPage cleanup');
      isMounted = false;
    };
  }, [searchQuery]);
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* 플로팅 버튼들 */}
      <div className="fixed right-4 bottom-20 flex flex-col gap-2 z-40">
        <button className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm shadow-lg hover:shadow-xl transition-shadow">
          평일상품
        </button>
        <button className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm shadow-lg hover:shadow-xl transition-shadow">
          최근본상품
        </button>
        <button className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm shadow-lg hover:shadow-xl transition-shadow">
          ❤️ 찜
        </button>
        <button className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm shadow-lg hover:shadow-xl transition-shadow">
          최근 본 상품
        </button>
        <button className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm shadow-lg hover:shadow-xl transition-shadow">
          판매내역
        </button>
        <button className="bg-orange-500 text-white rounded-lg px-4 py-2 text-sm font-semibold shadow-lg hover:bg-orange-600 transition-colors">
          TOP
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {searchQuery ? (
          <div className="mb-6">
            <h2 className="text-xl font-bold">
              '<span className="text-orange-500">{searchQuery}</span>' 검색 결과
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              총 {products.length}개의 상품을 찾았습니다.
            </p>
          </div>
        ) : (
          <h2 className="text-xl font-bold mb-6">오늘의 상품 추천</h2>
        )}
        
        {loading ? (
          <div className="text-center py-20">
            <p className="text-gray-500">상품을 불러오는 중...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-6xl mb-4 block">🔍</span>
            {searchQuery ? (
              <>
                <p className="text-gray-500 mb-4">검색 결과가 없습니다.</p>
                <p className="text-sm text-gray-400">다른 키워드로 검색해보세요.</p>
              </>
            ) : (
              <>
                <p className="text-gray-500 mb-4">아직 등록된 상품이 없습니다.</p>
                <p className="text-sm text-gray-400">첫 번째 상품을 등록해보세요!</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => navigate(`/product/${product.id}`)}
                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                {/* 상품 이미지 */}
                <div className="bg-gray-100 h-48 flex items-center justify-center text-gray-400 relative">
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
                      <span className="bg-gray-900 bg-opacity-75 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                        판매완료
                      </span>
                    </div>
                  )}
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
  );
});

export default MainPage;
