# AI Agent Instructions for nice2222 Project

이 문서는 AI 코딩 어시스턴트가 nice2222 프로젝트에서 코드를 작성할 때 따라야 할 지침을 제공합니다.

## 프로젝트 개요

- **스택**: React 19 + TypeScript + Vite 7
- **스타일링**: Tailwind CSS 4
- **UI 컴포넌트**: shadcn/ui (new-york 스타일)
- **아이콘**: Lucide React

## 핵심 개발 규칙

### 1. UI/UX 디자인 원칙

#### shadcn/ui 적극 활용
- 모든 UI 컴포넌트 개발 시 shadcn/ui를 **우선적으로** 사용하세요
- 커스텀 컴포넌트보다 shadcn/ui의 기존 컴포넌트를 활용하세요
- shadcn/ui 컴포넌트는 접근성(a11y), 반응형, 다크모드를 기본 지원합니다

#### 사용 가능한 shadcn/ui 컴포넌트 예시
- 버튼, 입력 폼, 카드, 다이얼로그, 드롭다운, 토스트 등
- 모든 shadcn/ui 컴포넌트: https://ui.shadcn.com/docs/components

### 2. 컴포넌트 추가 방법

#### 터미널 명령어로 추가 필수
shadcn/ui 컴포넌트를 추가할 때는 **반드시 터미널 명령어**를 사용하세요:

```bash
# 단일 컴포넌트 추가
npx shadcn@latest add button

# 여러 컴포넌트 한 번에 추가
npx shadcn@latest add button card dialog

# 예시: 폼 관련 컴포넌트 추가
npx shadcn@latest add form input label textarea select
```

#### 컴포넌트 추가 워크플로우
1. 필요한 UI 컴포넌트 식별
2. `npx shadcn@latest add [component-name]` 명령어 실행
3. 자동 생성된 컴포넌트를 `src/components/ui/` 경로에서 확인
4. 필요에 따라 컴포넌트 커스터마이징

### 3. 컴포넌트 사용 규칙

#### Import 경로
프로젝트 별칭(alias)을 사용하세요:

```typescript
// ✅ 올바른 방법
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// ❌ 피해야 할 방법
import { Button } from "../components/ui/button"
import { Button } from "src/components/ui/button"
```

#### 스타일링
- Tailwind CSS 클래스를 사용하세요
- `cn()` 유틸리티로 조건부 클래스를 관리하세요
- 커스텀 CSS는 최소화하세요

```typescript
import { cn } from "@/lib/utils"

<Button className={cn(
  "custom-class",
  isActive && "bg-primary",
  isDisabled && "opacity-50"
)}>
  클릭
</Button>
```

### 4. 개발 모범 사례

#### TypeScript 타입 안정성
- 모든 컴포넌트에 적절한 타입을 정의하세요
- `any` 타입 사용을 피하세요
- Props 인터페이스를 명확하게 정의하세요

```typescript
interface ComponentProps {
  title: string
  onSubmit: (data: FormData) => void
  isLoading?: boolean
}

export function Component({ title, onSubmit, isLoading = false }: ComponentProps) {
  // ...
}
```

#### 컴포넌트 구조
- 작고 재사용 가능한 컴포넌트로 분리하세요
- UI 컴포넌트는 `src/components/ui/`에 배치
- 페이지/기능별 컴포넌트는 `src/components/`에 배치

#### 접근성 (a11y)
- shadcn/ui 컴포넌트는 기본적으로 접근성을 지원합니다
- 커스텀 컴포넌트 작성 시 ARIA 속성을 고려하세요
- 키보드 네비게이션을 테스트하세요

### 5. 상태 관리

#### 로컬 상태
- 간단한 상태는 `useState` 사용
- 복잡한 상태는 `useReducer` 고려

#### 폼 관리
- shadcn/ui의 Form 컴포넌트와 함께 react-hook-form 사용 권장

### 6. 스타일링 가이드

#### Tailwind CSS 4 사용
- 유틸리티 클래스 우선 사용
- 반응형 디자인: `sm:`, `md:`, `lg:`, `xl:` breakpoint 활용
- 다크모드: `dark:` prefix 활용

```typescript
<div className="p-4 bg-white dark:bg-gray-900 md:p-6 lg:p-8">
  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
    제목
  </h1>
</div>
```

#### 색상 시스템
- 프로젝트는 `neutral` 베이스 컬러를 사용합니다
- CSS 변수를 통해 일관된 색상 사용

### 7. 아이콘 사용

#### Lucide React
모든 아이콘은 lucide-react 라이브러리를 사용하세요:

```typescript
import { Check, X, Plus, Settings } from "lucide-react"

<Button>
  <Plus className="mr-2 h-4 w-4" />
  추가하기
</Button>
```

### 8. 파일 구조

```
src/
├── components/
│   ├── ui/              # shadcn/ui 컴포넌트 (자동 생성)
│   └── ...              # 커스텀 컴포넌트
├── lib/
│   └── utils.ts         # 유틸리티 함수
├── hooks/               # 커스텀 훅
├── App.tsx
└── main.tsx
```

## 빠른 참조

### 자주 사용하는 컴포넌트 추가 명령어

```bash
# 기본 UI
npx shadcn@latest add button input label card

# 폼 요소
npx shadcn@latest add form select textarea checkbox radio-group

# 레이아웃
npx shadcn@latest add separator tabs accordion

# 피드백
npx shadcn@latest add toast alert dialog

# 네비게이션
npx shadcn@latest add dropdown-menu navigation-menu

# 데이터 표시
npx shadcn@latest add table badge avatar
```

### 개발 서버 실행

```bash
npm run dev      # 개발 서버 시작
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 미리보기
npm run lint     # ESLint 검사
```

## 요약

1. **shadcn/ui 우선**: 모든 UI 개발에서 shadcn/ui를 적극 활용
2. **터미널 명령어**: 컴포넌트는 `npx shadcn@latest add` 명령어로 추가
3. **TypeScript**: 타입 안정성 유지
4. **Tailwind CSS**: 유틸리티 클래스 기반 스타일링
5. **접근성**: a11y를 고려한 개발
6. **재사용성**: 작고 조합 가능한 컴포넌트 작성

이 가이드를 따라 일관되고 유지보수 가능한 코드를 작성하세요.
