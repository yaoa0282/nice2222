import { supabase } from './supabase';
import type { Review, ReviewInsert } from '../types/database.types';

// 리뷰 작성 (Fetch API)
export function createReview(review: ReviewInsert): Promise<Review> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
  const key = `sb-${projectRef}-auth-token`;
  const sessionStr = localStorage.getItem(key);
  
  if (!sessionStr) throw new Error('로그인이 필요합니다.');
  
  const session = JSON.parse(sessionStr);
  const user = session?.user;
  const accessToken = session?.access_token;
  
  if (!user || !accessToken) throw new Error('로그인이 필요합니다.');
  
  // 판매자는 자신의 상품에 리뷰를 작성할 수 없음
  if (review.seller_id && user.id === review.seller_id) {
    throw new Error('판매자는 자신의 판매글에 리뷰를 작성할 수 없습니다.');
  }

  // seller_id는 검증용이므로 실제 DB에 저장하지 않음
  const { seller_id, ...reviewData } = review;

  return fetch(`${supabaseUrl}/rest/v1/reviews`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      ...reviewData,
      reviewer_id: user.id,
    }),
  })
    .then(response => response.json())
    .then(data => {
      const review = Array.isArray(data) ? data[0] : data;
      console.log('✅ 리뷰 작성 완료:', review);
      return review as Review;
    });
}

// 특정 사용자가 받은 리뷰 가져오기 (Fetch API)
export function getUserReviews(userId: string): Promise<Review[]> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
  const key = `sb-${projectRef}-auth-token`;
  const sessionStr = localStorage.getItem(key);
  const accessToken = sessionStr ? JSON.parse(sessionStr)?.access_token : supabaseKey;
  
  return fetch(`${supabaseUrl}/rest/v1/reviews?reviewee_id=eq.${userId}&order=created_at.desc`, {
    method: 'GET',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })
    .then(response => response.json())
    .then(data => data as Review[]);
}

// 특정 상품에 대한 리뷰 확인 (Fetch API)
export function getProductReview(productId: string, reviewerId: string): Promise<Review | null> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
  const key = `sb-${projectRef}-auth-token`;
  const sessionStr = localStorage.getItem(key);
  const accessToken = sessionStr ? JSON.parse(sessionStr)?.access_token : supabaseKey;
  
  return fetch(`${supabaseUrl}/rest/v1/reviews?product_id=eq.${productId}&reviewer_id=eq.${reviewerId}`, {
    method: 'GET',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })
    .then(response => response.json())
    .then(data => {
      if (Array.isArray(data) && data.length === 0) return null;
      return (Array.isArray(data) ? data[0] : data) as Review | null;
    })
    .catch(() => null);
}

// 사용자의 평균 평점 가져오기 (Fetch API)
export function getUserAverageRating(userId: string): Promise<{ average: number; count: number }> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
  const key = `sb-${projectRef}-auth-token`;
  const sessionStr = localStorage.getItem(key);
  const accessToken = sessionStr ? JSON.parse(sessionStr)?.access_token : supabaseKey;
  
  return fetch(`${supabaseUrl}/rest/v1/reviews?reviewee_id=eq.${userId}&select=rating`, {
    method: 'GET',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })
    .then(response => response.json())
    .then(data => {
      if (!data || data.length === 0) return { average: 0, count: 0 };

      const sum = data.reduce((acc: number, review: any) => acc + review.rating, 0);
      const average = sum / data.length;

      return { average: Math.round(average * 10) / 10, count: data.length };
    });
}

// 리뷰 수정 (Fetch API)
export function updateReview(reviewId: string, rating: number, comment?: string): Promise<Review> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
  const key = `sb-${projectRef}-auth-token`;
  const sessionStr = localStorage.getItem(key);
  
  if (!sessionStr) throw new Error('로그인이 필요합니다.');
  
  const session = JSON.parse(sessionStr);
  const accessToken = session?.access_token;
  
  if (!accessToken) throw new Error('로그인이 필요합니다.');

  return fetch(`${supabaseUrl}/rest/v1/reviews?id=eq.${reviewId}`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({ rating, comment }),
  })
    .then(response => response.json())
    .then(data => {
      const reviewData = Array.isArray(data) ? data[0] : data;
      return reviewData as Review;
    });
}

// 리뷰 삭제 (Fetch API)
export function deleteReview(reviewId: string): Promise<void> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
  const key = `sb-${projectRef}-auth-token`;
  const sessionStr = localStorage.getItem(key);
  
  if (!sessionStr) throw new Error('로그인이 필요합니다.');
  
  const session = JSON.parse(sessionStr);
  const accessToken = session?.access_token;
  
  if (!accessToken) throw new Error('로그인이 필요합니다.');

  return fetch(`${supabaseUrl}/rest/v1/reviews?id=eq.${reviewId}`, {
    method: 'DELETE',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })
    .then(() => undefined);
}
