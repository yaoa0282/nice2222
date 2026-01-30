import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { createProduct } from '../lib/products';
import { supabase } from '../lib/supabase';
import { uploadProductImages } from '../lib/storage';

export default function WritePage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // 로그인 확인
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert('로그인이 필요합니다.');
        navigate('/login');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (images.length + files.length > 10) {
      alert('이미지는 최대 10장까지 등록 가능합니다.');
      return;
    }

    setImages([...images, ...files]);

    // 미리보기 생성
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('로그인이 필요합니다.');

      // 이미지 업로드
      let imageUrl = '';
      if (images.length > 0) {
        const uploadedUrls = await uploadProductImages(images, user.id);
        imageUrl = uploadedUrls[0]; // 첫 번째 이미지를 대표 이미지로 사용
      }

      await createProduct({
        title,
        content,
        price: parseInt(price),
        location,
        image_url: imageUrl,
      });

      alert('상품이 등록되었습니다!');
      navigate('/');
    } catch (error: any) {
      console.error('상품 등록 실패:', error);
      setError(error.message || '상품 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold mb-6">상품 등록</h1>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 이미지 업로드 영역 */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                상품 이미지 ({images.length}/10)
              </label>
              
              {/* 이미지 미리보기 */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`preview ${index}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-orange-500 transition-colors cursor-pointer block">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={images.length >= 10}
                />
                <span className="text-6xl">📷</span>
                <p className="mt-2 text-sm text-gray-500">클릭하여 이미지 추가</p>
                <p className="text-xs text-gray-400 mt-1">최대 10장까지 등록 가능</p>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">상품명</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="상품명을 입력하세요"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">가격</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">거래지역</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="예: 서울 강남구"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">상품 설명</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[200px]"
                placeholder="상품 설명을 입력하세요&#10;&#10;- 상품 상태&#10;- 구매 시기&#10;- 하자 유무 등"
                required
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                type="submit" 
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold"
                disabled={loading}
              >
                {loading ? '등록 중...' : '등록하기'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 py-3"
                onClick={() => navigate('/')}
                disabled={loading}
              >
                취소
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
