# 맛플리 (MatPly) - YouTube 맛집 찾기 서비스

> YouTube 좋아요 영상에서 AI가 찾아주는 나만의 맛집 리스트

---

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **서비스명** | 맛플리 (MatPly) |
| **목적** | YouTube 좋아요/재생목록 영상에서 AI가 맛집 영상을 자동 분류하여 음식점 리스트로 정리 |
| **핵심 가치** | 좋아요 목록 속 묻혀있는 맛집 영상을 발굴하여 실제 방문 계획으로 연결 |
| **GitHub** | https://github.com/rlaxhwhd/FoodTube |

---

## 실제 기술 스택 (구현 완료)

| 계층 | 기술 | 역할 |
|------|------|------|
| **Framework** | Next.js 16 (App Router) + TypeScript | 풀스택 (SSR + API Routes) |
| **Database** | TiDB Cloud (MySQL) + Prisma v6 | 사용자/음식점/스캔 저장 |
| **Auth** | Auth.js v5 (next-auth@beta) | Google OAuth + youtube.readonly |
| **AI** | Groq (Llama 3.1 8B) | 맛집 분류 + 정보 추출 |
| **UI** | Tailwind CSS + shadcn/ui | 컴포넌트 라이브러리 |
| **Deploy** | Vercel (예정) | 배포 |

> 원래 계획: PostgreSQL + BullMQ + Redis + Express 별도 백엔드
> 실제 구현: Next.js 풀스택 + TiDB + `after()` 비동기 처리로 간소화

---

## 7일 개발 계획 진행 현황

### Day 1: 프로젝트 세팅 + 인증 ✅ 완료

- [x] Next.js 16 + TypeScript + Tailwind + shadcn/ui 초기화
- [x] TiDB Cloud MySQL 연결 + Prisma 스키마 설계
- [x] Auth.js v5 Google OAuth 설정 (`youtube.readonly` scope)
- [x] 토큰 저장/갱신 로직 (Account 테이블)
- [x] 기본 레이아웃 (Header, 로그인 버튼)

### Day 2: YouTube API 연동 ✅ 완료

- [x] 좋아요 영상 ID 수집 (`playlistItems.list`)
- [x] 재생목록 영상 ID 수집 (`playlistItems.list`)
- [x] 영상 상세정보 배치 수집 (`videos.list`, 50개씩)
- [x] 상단 댓글 수집 (`commentThreads.list`)
- [x] 댓글 비활성화 graceful fallback
- [x] YouTube API 에러 메시지 (401/403)

### Day 3: AI 파이프라인 구현 ✅ 완료

- [x] 1단계: 맛집 영상 분류 (배치 30개)
- [x] 2단계: 음식점 정보 추출 (배치 10개)
- [x] JSON 응답 강제 (`response_format: json_object`)
- [x] 지수 백오프 재시도 (2s → 4s → 8s, 최대 3회)
- [x] 비동기 파이프라인 (`after()` + 클라이언트 폴링 2.5s)
- [x] 파이프라인 단계별 로깅
- [x] 중복 스캔 방지 (409 응답)

### Day 4: 맛집 리스트 UI ✅ 완료

- [x] 맛집 카드 컴포넌트 (썸네일 + 식당명 + 지역 + 음식종류)
- [x] 삭제 버튼 (호버 시 X 아이콘, confirm 확인)
- [x] DELETE API (`/api/restaurants/[id]`)
- [x] DB 중복 방지 (userId + videoId + restaurantName 유니크 제약)
- [x] 빈 상태 / 에러 상태 UI
- [x] YouTube 영상 바로가기 링크

### Day 5: UI 폴리싱 + 접근성 ✅ 완료

- [x] Web Interface Guidelines 적용 (Vercel)
- [x] aria-label, aria-hidden, aria-live 접근성
- [x] 키보드 접근성 (tabIndex, onKeyDown)
- [x] Skip-to-content 링크
- [x] 이미지 최적화 (width/height, loading="lazy", fallback)
- [x] Intl.DateTimeFormat / Intl.NumberFormat
- [x] tabular-nums, truncate, transition 개선
- [x] 스캔 진행 UI (단계 표시, 통계)
- [x] 소스 선택 UI (좋아요 / 재생목록)
- [x] 재생목록 선택 피커

### Day 6: 버그 수정 + 안정화 ✅ 완료

- [x] 토큰 만료 비교 버그 수정 (`Date.now() + 300000`)
- [x] 댓글 수집 순차 처리 (YouTube API 쿼터 보호)
- [x] AI API 전환: Gemini → OpenAI → Claude → **Groq** (할당량 문제 해결)
- [x] 멈춤 ScanJob 정리 로직
- [x] GitHub 저장소 정리 (서브모듈 → 직접 파일)

### Day 7: 배포 + 추가 기능 🔲 미완료

- [ ] Vercel 배포
- [ ] 환경변수 설정 (Vercel Dashboard)
- [ ] Google OAuth 리다이렉트 URI 추가 (production URL)
- [ ] 상태 관리 ("가보고 싶어요" / "가봤어요" 토글)
- [ ] 별점 기능 (1~5점)
- [ ] 메모 기능
- [ ] 정렬 (최신순 / 별점순)
- [ ] FREE_VIDEO_LIMIT 200으로 복원

---

## 핵심 파일 구조

```
matply/
├── prisma/schema.prisma          # DB 스키마 (User, Account, ScanJob, Restaurant)
├── src/
│   ├── app/
│   │   ├── page.tsx              # 랜딩 페이지
│   │   ├── layout.tsx            # 루트 레이아웃 (skip-to-content)
│   │   ├── dashboard/page.tsx    # 대시보드 (소스 선택)
│   │   ├── scan/[jobId]/page.tsx # 스캔 진행 화면
│   │   ├── restaurants/page.tsx  # 내 맛집 리스트
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts  # Auth.js
│   │       ├── scan/route.ts               # POST: 스캔 시작
│   │       ├── scan/[jobId]/route.ts       # GET: 스캔 상태
│   │       ├── playlists/route.ts          # GET: 재생목록
│   │       ├── restaurants/route.ts        # GET: 맛집 목록
│   │       └── restaurants/[id]/route.ts   # DELETE: 맛집 삭제
│   ├── components/
│   │   ├── auth/login-button.tsx
│   │   ├── layout/header.tsx
│   │   ├── scan/source-selector.tsx
│   │   ├── scan/playlist-picker.tsx
│   │   ├── scan/scan-progress.tsx
│   │   └── restaurant/restaurant-card.tsx
│   ├── hooks/use-scan.ts         # 폴링 훅
│   ├── lib/
│   │   ├── auth.ts               # Auth.js 설정 + 토큰 관리
│   │   ├── gemini.ts             # AI 서비스 (실제로는 Groq)
│   │   ├── scanner.ts            # 스캔 파이프라인
│   │   ├── youtube.ts            # YouTube API
│   │   └── prisma.ts             # Prisma 클라이언트
│   └── types/index.ts            # 타입 정의
├── .env.local                    # 환경변수 (gitignore)
└── package.json
```

---

## 환경변수 (.env.local 필요)

```env
DATABASE_URL="mysql://..."          # TiDB Cloud
AUTH_SECRET="..."                   # Auth.js 시크릿
AUTH_GOOGLE_ID="..."                # Google OAuth Client ID
AUTH_GOOGLE_SECRET="..."            # Google OAuth Client Secret
GROQ_API_KEY="gsk_..."             # Groq API 키
NEXT_PUBLIC_APP_URL="http://localhost:3000"
FREE_VIDEO_LIMIT=30                 # 영상 수집 제한 (테스트: 30, 운영: 200)
```

---

## AI 파이프라인 흐름

```
YouTube API (좋아요/재생목록)
  → 영상 ID 수집 (최대 200개)
  → 영상 상세정보 배치 수집
  → [1단계] Groq AI 맛집 분류 (30개 배치)
  → 맛집 영상만 댓글 수집
  → [2단계] Groq AI 음식점 정보 추출 (10개 배치)
  → DB 저장 (중복 방지)
  → 맛집 리스트 표시
```

---

## 해결된 이슈 로그

| 이슈 | 원인 | 해결 |
|------|------|------|
| 토큰 갱신 안 됨 | 만료 비교 방향 반대 | `Date.now() + 300000` 으로 수정 |
| Gemini 429 | 무료 일일 할당량 소진 (limit: 0) | Groq (무료 14,400 RPD) 로 전환 |
| 맛집 0건 | AI 실패 → fallback이 전부 false | 로그 추가 + AI 전환으로 해결 |
| 스캔 무한 대기 | 이전 job이 filtering에서 멈춤 → 409 | 멈춤 job 강제 종료 + 로깅 |
| GitHub 폴더 안 열림 | .git이 상위에 + 서브모듈 잔재 | matply 내 git init + force push |
| 중복 맛집 저장 | 유니크 제약 없음 | @@unique([userId, videoId, restaurantName]) |
