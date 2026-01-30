import { supabase } from './supabase';
import type { Profile } from '../types/database.types';

// 프로필 가져오기 (Fetch API)
export function getProfile(userId: string): Promise<Profile | null> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
  const key = `sb-${projectRef}-auth-token`;
  const sessionStr = localStorage.getItem(key);
  const accessToken = sessionStr ? JSON.parse(sessionStr)?.access_token : supabaseKey;
  
  return fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'GET',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.pgrst.object+json',
    },
  })
    .then(response => response.json())
    .then(data => {
      // 빈 배열이면 null 반환
      if (Array.isArray(data) && data.length === 0) return null;
      // 배열이면 첫 번째 요소 반환
      return (Array.isArray(data) ? data[0] : data) as Profile | null;
    });
}

// 여러 프로필 가져오기
export async function getProfiles(userIds: string[]) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds);

  if (error) throw error;
  return data as Profile[];
}

// 프로필 수정 (Fetch API)
export function updateProfile(userId: string, updates: { nickname?: string; birth_date?: string }): Promise<Profile> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
  const key = `sb-${projectRef}-auth-token`;
  const sessionStr = localStorage.getItem(key);
  
  if (!sessionStr) throw new Error('로그인이 필요합니다.');
  
  const session = JSON.parse(sessionStr);
  const accessToken = session?.access_token;
  
  if (!accessToken) throw new Error('로그인이 필요합니다.');

  return fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(updates),
  })
    .then(response => response.json())
    .then(data => {
      const profileData = Array.isArray(data) ? data[0] : data;
      return profileData as Profile;
    });
}
