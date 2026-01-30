import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { createProduct } from '../lib/products';
import type { ProductInsert } from '../types/database.types';

const SAMPLE_PRODUCTS: Omit<ProductInsert, 'image_url'>[] = [
  { title: '아이폰 15 Pro 256GB', content: '직거래만 합니다. 박스 개봉만 했고 사용 안 했어요. 완충 완충지 포함.', price: 1150000, location: '서울 강남구' },
  { title: '맥북 에어 M2 13인치', content: '1년 사용. 배터리 사이클 80회. 케이스 포함.', price: 980000, location: '서울 서초구' },
  { title: '삼성 갤럭시 버즈2 프로', content: '미개봉 새상품. 선물 받았는데 사용 안 함.', price: 189000, location: '경기 성남시' },
  { title: '무선 충전기 3in1', content: '아이폰/에어팟/애플워치 동시 충전. 상태 좋음.', price: 45000, location: '인천 부평구' },
  { title: 'IKEA 침대 프레임 퀸', content: '이사로 인한 판매. 조립 도구 포함. 픽업만 가능.', price: 120000, location: '경기 고양시' },
  { title: '닌텐도 스위치 OLED', content: '2개월 사용. 정품 충전기, 독 포함. 게임 3종 증정.', price: 320000, location: '대구 수성구' },
  { title: '에어팟 프로 2세대', content: '6개월 사용. 귀걸이 3종류 포함. 상태 양호.', price: 210000, location: '부산 해운대구' },
  { title: '가죽 소파 2인용', content: '브라운 컬러. 1년 사용. 스크래치 없음.', price: 250000, location: '서울 마포구' },
  { title: '전자레인지 23L', content: '미사용 새제품. 이중 구매로 판매.', price: 65000, location: '광주 서구' },
  { title: '유니클로 패딩 점퍼', content: 'L사이즈. 2번만 착용. 세탁 1회.', price: 35000, location: '대전 유성구' },
  { title: '책상 컴퓨터 데스크', content: '120x60cm. 서랍 2개. 픽업만 가능.', price: 80000, location: '경기 용인시' },
  { title: '다이슨 청소기 V11', content: '1년 사용. 필터 교체 완료. 부품 완비.', price: 280000, location: '서울 송파구' },
  { title: '자전거 로드바이크', content: '21단. 26인치. 헬멧·물병걸이 포함.', price: 150000, location: '경기 수원시' },
  { title: '캠핑 테이블 접이식', content: '2인용. 사용 3회. 수납 가방 포함.', price: 42000, location: '강원 춘천시' },
  { title: '코웨이 정수기', content: '렌탈 해지로 인한 판매. 설치비 별도.', price: 100000, location: '경기 화성시' },
];

export default function SeedPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('로그인이 필요합니다.');
        navigate('/login');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSeed = async () => {
    setError('');
    setLoading(true);
    setDone(0);
    try {
      for (let i = 0; i < SAMPLE_PRODUCTS.length; i++) {
        await createProduct(SAMPLE_PRODUCTS[i]);
        setDone(i + 1);
      }
      alert(`${SAMPLE_PRODUCTS.length}개 상품이 등록되었습니다.`);
      navigate('/');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '등록 중 오류가 났습니다.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold mb-2">샘플 상품 올리기</h1>
          <p className="text-sm text-gray-600 mb-6">
            현재 로그인한 계정으로 샘플 상품 {SAMPLE_PRODUCTS.length}개를 한 번에 등록합니다.
          </p>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={handleSeed}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {loading ? `${done} / ${SAMPLE_PRODUCTS.length} 등록 중...` : `상품 ${SAMPLE_PRODUCTS.length}개 등록하기`}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full mt-3 py-2 text-gray-600 hover:text-gray-800"
          >
            메인으로
          </button>
        </div>
      </div>
    </div>
  );
}
