function getSession() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
  const key = `sb-${projectRef}-auth-token`;
  const sessionStr = localStorage.getItem(key);
  const session = sessionStr ? JSON.parse(sessionStr) : null;
  const accessToken = session?.access_token ?? supabaseKey;
  const userId = session?.user?.id ?? null;
  return { supabaseUrl, supabaseKey, accessToken, userId };
}

/** 상품 찜 개수 */
export function getLikeCount(productId: string): Promise<number> {
  const { supabaseUrl, supabaseKey, accessToken } = getSession();
  return fetch(
    `${supabaseUrl}/rest/v1/product_likes?product_id=eq.${productId}&select=id`,
    {
      method: 'GET',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'count=exact',
      },
    }
  )
    .then((r) => {
      const range = r.headers.get('content-range');
      if (range) {
        const m = range.match(/\/(\d+)$/);
        return m ? parseInt(m[1], 10) : 0;
      }
      return r.json().then((arr: unknown[]) => (Array.isArray(arr) ? arr.length : 0));
    })
    .catch(() => 0);
}

/** 현재 사용자가 이 상품을 찜했는지 (로그인 안 했으면 false) */
export function hasUserLiked(productId: string, userId: string | null): Promise<boolean> {
  if (!userId) return Promise.resolve(false);
  const { supabaseUrl, supabaseKey, accessToken } = getSession();
  return fetch(
    `${supabaseUrl}/rest/v1/product_likes?product_id=eq.${productId}&user_id=eq.${userId}&select=id`,
    {
      method: 'GET',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  )
    .then((r) => r.json())
    .then((data: { id: string }[]) => Array.isArray(data) && data.length > 0)
    .catch(() => false);
}

/** 찜 토글. 로그인 필요. 반환: 토글 후 찜 여부 (true=찜함, false=찜 해제) */
export function toggleProductLike(productId: string): Promise<boolean> {
  const { supabaseUrl, supabaseKey, accessToken, userId } = getSession();
  if (!userId) return Promise.reject(new Error('로그인이 필요합니다.'));

  return hasUserLiked(productId, userId).then((liked) => {
    if (liked) {
      return fetch(
        `${supabaseUrl}/rest/v1/product_likes?product_id=eq.${productId}&user_id=eq.${userId}`,
        {
          method: 'DELETE',
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      ).then(() => false);
    }
    return fetch(`${supabaseUrl}/rest/v1/product_likes`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ product_id: productId, user_id: userId }),
    }).then(() => true);
  });
}
