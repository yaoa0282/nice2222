import { useEffect, useState, useRef, memo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getProfile } from '../lib/profiles';
import { getTotalUnreadCount } from '../lib/chat';
import { Button } from './ui/button';
import toast from 'react-hot-toast';

type User = {
  id: string;
  email?: string;
  created_at?: string;
};

const Navbar = memo(function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const lastUserIdRef = useRef<string | null>(null);
  const lastUnreadCountRef = useRef<number>(0);
  const lastPathRef = useRef<string>('');
  const isFirstCheckRef = useRef<boolean>(true); // 초기 로드 플래그
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('🔵 Navbar useEffect 시작');
    let isMounted = true;
    
    // 현재 사용자 정보 가져오기
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!isMounted) return;
      
      console.log('👤 현재 사용자:', user?.email);
      if (user?.id === lastUserIdRef.current) {
        console.log('⏭️ 동일한 사용자, 스킵');
        return;
      }
      
      lastUserIdRef.current = user?.id || null;
      setUser(user);
      if (user) {
        try {
          const profile = await getProfile(user.id);
          if (!isMounted) return;
          console.log('✅ 프로필 로드:', profile?.nickname);
          setNickname(profile?.nickname || user.email || '사용자');
        } catch (error) {
          if (!isMounted) return;
          console.error('❌ 프로필 로딩 실패:', error);
          setNickname(user.email || '사용자');
        }
      }
    });

    // 인증 상태 변경 감지 (중요 이벤트만 처리)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      console.log('🔄 인증 상태 변경:', event, session?.user?.email);
      
      // INITIAL_SESSION, TOKEN_REFRESHED 등 무시
      if (event !== 'SIGNED_IN' && event !== 'SIGNED_OUT') {
        console.log('⏭️ 이벤트 무시:', event);
        return;
      }
      
      // 동일한 사용자면 스킵
      if (session?.user?.id === lastUserIdRef.current) {
        console.log('⏭️ 동일한 사용자, 스킵');
        return;
      }
      
      lastUserIdRef.current = session?.user?.id || null;
      setUser(session?.user ?? null);
      
      if (session?.user && event === 'SIGNED_IN') {
        try {
          const profile = await getProfile(session.user.id);
          if (!isMounted) return;
          console.log('✅ 프로필 로드 (onAuthStateChange):', profile?.nickname);
          setNickname(profile?.nickname || session.user.email || '사용자');
        } catch (error) {
          if (!isMounted) return;
          console.error('❌ 프로필 로딩 실패:', error);
          setNickname(session.user.email || '사용자');
        }
      } else if (event === 'SIGNED_OUT') {
        setNickname('');
      }
    });

    return () => {
      console.log('🔴 Navbar cleanup');
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // 읽지 않은 메시지 개수 체크 (10초마다)
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      lastUnreadCountRef.current = 0;
      isFirstCheckRef.current = true;
      return;
    }

    let isMounted = true;

    const checkUnreadMessages = async () => {
      try {
        console.log('🔔 읽지 않은 메시지 체크 중...');
        const count = await getTotalUnreadCount();
        
        if (!isMounted) return;
        
        console.log(`📊 현재: ${count}개, 이전: ${lastUnreadCountRef.current}개, 경로: ${location.pathname}, 초기: ${isFirstCheckRef.current}`);
        
        // 새 메시지가 왔을 때만 알림 (초기 로드 제외, 채팅방에서는 알림 안 함)
        if (!isFirstCheckRef.current && count > lastUnreadCountRef.current && count > 0 && !location.pathname.startsWith('/chat')) {
          console.log('✅ 토스트 알림 표시!');
          toast('💬 새로운 메시지가 도착했습니다!', {
            duration: 3000,
            icon: '🔔',
            style: {
              background: '#f97316',
              color: '#fff',
            },
          });
        } else if (!isFirstCheckRef.current) {
          console.log('⏭️ 알림 조건 불충족:', {
            isIncrease: count > lastUnreadCountRef.current,
            hasMessage: count > 0,
            notInChat: !location.pathname.startsWith('/chat'),
          });
        }
        
        isFirstCheckRef.current = false;
        lastUnreadCountRef.current = count;
        setUnreadCount(count);
      } catch (error) {
        console.error('❌ 읽지 않은 메시지 체크 실패:', error);
      }
    };

    // 즉시 첫 실행 (초기 카운트 설정)
    checkUnreadMessages();

    // 10초마다 체크
    const interval = setInterval(checkUnreadMessages, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  // 경로 변경 시 즉시 읽지 않은 메시지 체크
  useEffect(() => {
    if (!user) return;
    
    if (lastPathRef.current === '') {
      lastPathRef.current = location.pathname;
      return;
    }
    
    if (lastPathRef.current !== location.pathname) {
      lastPathRef.current = location.pathname;
      
      if (location.pathname.startsWith('/chat')) {
        getTotalUnreadCount()
          .then(count => {
            lastUnreadCountRef.current = count;
            setUnreadCount(count);
          })
          .catch(error => console.error('❌ 읽지 않은 메시지 체크 실패:', error));
      }
    }
  }, [location.pathname, user]);

  const handleLogout = () => {
    console.log('로그아웃 시작...');
    // Supabase 세션 제거
    localStorage.removeItem(`sb-${import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`);
    // 강제 새로고침
    window.location.href = '/';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/');
    }
  };

  return (
    <nav className="border-b bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* 왼쪽: 로고 */}
          <div className="flex items-center gap-4">
            <Link to="/" className="text-2xl font-bold text-orange-500">
                따봉봉
            </Link>
          </div>

          {/* 중앙: 검색바 */}
          <div className="flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="상품명, 지역명, 내용 검색"
                className="w-full px-4 py-2 border border-orange-300 rounded-lg focus:outline-none focus:border-orange-500"
              />
              <button 
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500 hover:text-orange-600"
              >
                🔍
              </button>
            </form>
          </div>

          {/* 오른쪽: 버튼들 */}
          <div className="flex items-center gap-6">
            {user ? (
              <>
                <Link to="/chat" className="flex items-center gap-1 text-sm hover:text-orange-500 relative">
                  <span>💬</span>
                  <span>채팅</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link to="/write" className="flex items-center gap-1 text-sm hover:text-orange-500">
                  <span>📝</span>
                  <span>판매하기</span>
                </Link>
                <Link to="/mypage" className="flex items-center gap-1 text-sm hover:text-orange-500">
                  <span>👤</span>
                  <span>{nickname || '내상점'}</span>
                </Link>
                <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-orange-500">
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm hover:text-orange-500">
                  로그인
                </Link>
                <Link to="/signup" className="text-sm px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
});

export default Navbar;
