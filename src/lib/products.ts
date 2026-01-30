import { supabase } from './supabase';
import type { Product, ProductInsert, ProductUpdate } from '../types/database.types';

// 모든 상품 가져오기
export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Product[];
}

// 특정 사용자의 상품 가져오기 (Fetch API)
export function getUserProducts(userId: string): Promise<Product[]> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
  const key = `sb-${projectRef}-auth-token`;
  const sessionStr = localStorage.getItem(key);
  const accessToken = sessionStr ? JSON.parse(sessionStr)?.access_token : supabaseKey;
  
  return fetch(`${supabaseUrl}/rest/v1/products?user_id=eq.${userId}&order=created_at.desc`, {
    method: 'GET',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })
    .then(response => response.json())
    .then(data => data as Product[]);
}

// 상품 등록
export async function createProduct(product: ProductInsert) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('로그인이 필요합니다.');

  const { data, error } = await supabase
    .from('products')
    .insert({
      ...product,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Product;
}

// 상품 수정
export async function updateProduct(productId: string, updates: ProductUpdate) {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId)
    .select()
    .single();

  if (error) throw error;
  return data as Product;
}

// 상품 삭제 (Fetch API)
export function deleteProduct(productId: string): Promise<void> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
  const key = `sb-${projectRef}-auth-token`;
  const sessionStr = localStorage.getItem(key);
  const accessToken = sessionStr ? JSON.parse(sessionStr)?.access_token : supabaseKey;

  return fetch(`${supabaseUrl}/rest/v1/products?id=eq.${productId}`, {
    method: 'DELETE',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })
    .then(() => undefined);
}

// 상품 상세 조회 (Fetch API)
export function getProduct(productId: string): Promise<Product> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
  const key = `sb-${projectRef}-auth-token`;
  const sessionStr = localStorage.getItem(key);
  const accessToken = sessionStr ? JSON.parse(sessionStr)?.access_token : supabaseKey;
  
  return fetch(`${supabaseUrl}/rest/v1/products?id=eq.${productId}`, {
    method: 'GET',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })
    .then(response => response.json())
    .then(data => data[0] as Product);
}

// 판매 완료 처리 (Fetch API)
export function markProductAsSold(productId: string): Promise<Product> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
  const key = `sb-${projectRef}-auth-token`;
  const sessionStr = localStorage.getItem(key);
  const accessToken = sessionStr ? JSON.parse(sessionStr)?.access_token : supabaseKey;

  return fetch(`${supabaseUrl}/rest/v1/products?id=eq.${productId}`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({ status: 'sold' }),
  })
    .then(response => response.json())
    .then(data => {
      const product = Array.isArray(data) ? data[0] : data;
      return product as Product;
    });
}

// 판매 중으로 변경 (Fetch API)
export function markProductAsActive(productId: string): Promise<Product> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
  const key = `sb-${projectRef}-auth-token`;
  const sessionStr = localStorage.getItem(key);
  const accessToken = sessionStr ? JSON.parse(sessionStr)?.access_token : supabaseKey;

  return fetch(`${supabaseUrl}/rest/v1/products?id=eq.${productId}`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({ status: 'active' }),
  })
    .then(response => response.json())
    .then(data => {
      const product = Array.isArray(data) ? data[0] : data;
      return product as Product;
    });
}

// 상품 검색
export async function searchProducts(keyword: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%,location.ilike.%${keyword}%`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Product[];
}
