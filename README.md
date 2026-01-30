# Nice - 중고거래 플랫폼

React + TypeScript + Vite + Supabase로 구축된 중고거래 웹 애플리케이션입니다.

## 주요 기능

- 🔐 사용자 인증 (로그인/회원가입)
- 📝 상품 등록
- 🏠 메인 페이지 (상품 목록)
- 👤 마이페이지
- 🔄 실시간 인증 상태 관리

## 기술 스택

- **Frontend**: React 19, TypeScript, Vite
- **UI**: TailwindCSS, shadcn/ui
- **Backend**: Supabase (Authentication, Database)
- **Routing**: React Router v6

## 시작하기

### 환경 설정

1. `.env` 파일을 생성하고 Supabase 정보를 입력하세요:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

## 프로젝트 구조

```
src/
├── components/
│   ├── Navbar.tsx        # 네비게이션 바
│   └── ui/               # shadcn/ui 컴포넌트
├── pages/
│   ├── MainPage.tsx      # 메인 페이지
│   ├── WritePage.tsx     # 글쓰기 페이지
│   ├── LoginPage.tsx     # 로그인 페이지
│   ├── SignupPage.tsx    # 회원가입 페이지
│   └── MyPage.tsx        # 마이페이지
├── lib/
│   └── supabase.ts       # Supabase 클라이언트 설정
└── App.tsx               # 라우팅 설정
```

---

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
