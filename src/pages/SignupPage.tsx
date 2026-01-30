import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (password !== confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 8) {
      toast.error('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    if (!nickname.trim()) {
      toast.error('닉네임을 입력해주세요.');
      return;
    }

    if (!birthDate) {
      toast.error('생년월일을 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      // 이메일 중복 확인
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .single();

      if (existingUser) {
        toast.error('이미 가입된 이메일입니다.');
        setLoading(false);
        return;
      }

      // 회원가입
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        // profiles 테이블에 사용자 정보 저장
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email,
            nickname: nickname.trim(),
            birth_date: birthDate,
          });

        if (profileError) throw profileError;
      }

      toast.success('회원가입이 완료되었습니다! 로그인해주세요.');
      navigate('/login');
    } catch (error: any) {
      console.error('회원가입 실패:', error);
      toast.error(error.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-100 flex items-center justify-center px-4 py-12">
      <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-orange-500 mb-3">⚡번개장터</h1>
          <p className="text-gray-600 text-lg">회원가입하고 거래를 시작하세요</p>
        </div>
        
        <form onSubmit={handleSignup} className="space-y-5">
          {/* 이메일 */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              이메일 주소
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              placeholder="example@email.com"
              required
            />
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              비밀번호 (8자 이상)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              placeholder="8자 이상 입력하세요"
              minLength={8}
              required
            />
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              비밀번호 확인
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              placeholder="비밀번호를 다시 입력하세요"
              minLength={8}
              required
            />
          </div>

          {/* 닉네임 */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              닉네임
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              placeholder="닉네임을 입력하세요"
              maxLength={20}
              required
            />
          </div>

          {/* 생년월일 */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              생년월일
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* 회원가입 버튼 */}
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all mt-6"
            disabled={loading}
          >
            {loading ? '가입 중...' : '회원가입'}
          </Button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-orange-500 hover:text-orange-600 font-bold transition-colors">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
