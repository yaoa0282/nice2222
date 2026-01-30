// 로컬스토리지에서 직접 세션 가져오기 (Supabase JS 우회)
export function getCurrentUser() {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
    const key = `sb-${projectRef}-auth-token`;
    
    const sessionStr = localStorage.getItem(key);
    if (!sessionStr) return null;
    
    const session = JSON.parse(sessionStr);
    return session?.user || null;
  } catch (error) {
    console.error('세션 로드 실패:', error);
    return null;
  }
}

export function logout() {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
    const key = `sb-${projectRef}-auth-token`;
    
    localStorage.removeItem(key);
    window.location.href = '/';
  } catch (error) {
    console.error('로그아웃 실패:', error);
    window.location.href = '/';
  }
}
