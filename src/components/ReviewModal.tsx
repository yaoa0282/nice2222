import { useState } from 'react';
import { createReview } from '../lib/reviews';
import { Button } from './ui/button';

interface ReviewModalProps {
  productId: string;
  revieweeId: string;
  sellerId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewModal({
  productId,
  revieweeId,
  sellerId,
  onClose,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    createReview({
      product_id: productId,
      reviewee_id: revieweeId,
      rating,
      comment: comment.trim() || undefined,
      is_anonymous: isAnonymous,
      seller_id: sellerId,
    })
      .then(() => {
        alert('리뷰가 등록되었습니다!');
        onSuccess();
        onClose();
      })
      .catch((error: any) => {
        console.error('리뷰 등록 실패:', error);
        alert(error.message || '리뷰 등록에 실패했습니다.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-6">리뷰 작성</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 별점 */}
          <div>
            <label className="block text-sm font-medium mb-2">평점</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="text-4xl transition-transform hover:scale-110"
                >
                  {star <= rating ? '⭐' : '☆'}
                </button>
              ))}
            </div>
          </div>

          {/* 코멘트 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              리뷰 내용 (선택)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[120px]"
              placeholder="거래 경험을 공유해주세요..."
            />
          </div>

          {/* 익명 선택 */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
            />
            <label htmlFor="anonymous" className="text-sm cursor-pointer">
              <span className="font-medium">익명으로 작성</span>
              <p className="text-gray-500 text-xs mt-1">
                체크하면 작성자 이름이 "익명"으로 표시됩니다
              </p>
            </label>
          </div>

          {/* 버튼 */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={loading}
            >
              취소
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-orange-500 hover:bg-orange-600"
              disabled={loading}
            >
              {loading ? '등록 중...' : '리뷰 등록'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
