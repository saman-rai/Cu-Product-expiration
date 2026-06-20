# Here's the full plan I've designed based on my thorough analysis:

  ───
  The project already has a solid base — product CRUD, categories, barcode
  scanning, Excel import/export, responsive CSS, and Korean UI. Here's what
  I'll add:

  1. 서버 — 새 API 엔드포인트

  - GET /api/dashboard/expiry-alerts — 오늘/내일/초과 제품 리스트 (로그인
  팝업용)
  - GET
  /api/products/expiring?group=today|tomorrow|this_week|next_week|expired —
  그룹별 조회 + 페이지네이션

  2. 새 페이지 & 컴포넌트

  - ExpiryAlertModal — 로그인 시 표시되는 알림 팝업 (3개 섹션 + "오늘 하루
  보지 않기")
  - ExpiringSoon — 탭 기반 소멸 임박 페이지 (초과/오늘/내일/이번주/다음주)
  - QuickScan — 카메라 즉시 실행, 바코드 스캔 → 유통기한 빠르게 업데이트
  - BottomNav — 모바일 하단 네비게이션 (홈/스캔/제품/소멸/더보기)
  - FAB — 모바일 우측 하단 플로팅 버튼 → 스캔 바로가기

  3. PWA

  - manifest.json, sw.js, 앱 아이콘 — "Add to Home Screen" 지원

  4. 모바일 UX 개선

  - 터치 타겟 최소 44px (Apple HIG)
  - iOS 자동 확대 방지 (font-size: 16px)

  5. 기존 파일 수정

  - App.jsx — 2개 새 라우트 추가
  - api.js — 2개 새 메서드
  - Layout.jsx — 소멸 임박 네비게이션 + FAB
  - Dashboard.jsx — 알림 팝업 트리거
  - App.css — 모든 새 컴포넌트 스타일
  - index.html, main.jsx — PWA 메타/서비스워커

  구현 순서: 서버 API 2개 → 클라이언트 API → 컴포넌트 4개 → 라우트/레이아웃 →
  PWA → 스타일

  ───
  Want me to start building this? I'll work through it step by step — start
  with the server endpoints, then move to the client components.