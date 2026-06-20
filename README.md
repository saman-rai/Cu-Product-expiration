# CU 편의점 유통기한 관리 시스템 🏪

CU 편의점 재고의 **유통기한을 추적하고 알림**하는 웹 애플리케이션입니다.  
바코드 스캔, 카테고리/서브카테고리 관리, 엑셀 가져오기/내보내기를 지원합니다.

---

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| **제품 관리** | 바코드, 제품명, 유통기한, 진열장 위치, 수량, 가격 등 전체 CRUD |
| **바코드 스캔** | 카메라 스캔 + USB 스캐너 지원 → 기존 제품 자동 조회 |
| **빠른 스캔** | `/scan` 페이지에서 카메라 즉시 실행 → 유통기한 빠르게 업데이트 |
| **유통기한 알림** | 로그인 시 오늘/내일/초과 제품 팝업 알림 |
| **소멸 임박 페이지** | 탭별 조회: 초과/오늘/내일/이번주/다음주 |
| **카테고리 트리** | 상위/하위 카테고리 계층 구조 |
| **공급업체 관리** | 공급업체 CRUD |
| **엑셀 가져오기** | 템플릿 다운로드 → 엑셀 작성 → 업로드 (대량 등록) |
| **엑셀 내보내기** | 전체 제품을 `.xlsx` 파일로 다운로드 |
| **대시보드** | 유통기한 상태별 요약 카드 + 임박 제품 테이블 |
| **모바일 최적화** | 하단 네비게이션, FAB, 반응형 디자인 |
| **PWA 지원** | "홈 화면에 추가" → 앱처럼 사용 가능 |

---

## 🚀 시작하기

### 1. 설치

```bash
# 서버 의존성
cd server && npm install

# 클라이언트 의존성
cd ../client && npm install

# 루트 의존성 (concurrently)
cd .. && npm install
```

### 2. 환경 변수

`.env` 파일 (루트 디렉토리):
```
SESSION_SECRET=your-secret-key
PORT=3001
```

### 3. 시드 데이터 & 실행

```bash
# 관리자 계정 + 샘플 데이터 생성
npm run seed

# 개발 서버 실행 (서버 3001 + 클라이언트 5173)
npm run dev
```

**기본 로그인:** `admin` / `admin123`

---

## 🔧 기술 스택

| 계층 | 기술 |
|------|------|
| **프론트엔드** | React 19, React Router 7, Vite 6 |
| **백엔드** | Express 4, sql.js (SQLite WASM) |
| **인증** | 세션 기반 (express-session + file-store) |
| **엑셀** | sheetjs (xlsx) |
| **바코드** | html5-qrcode (카메라), USB 키보드 웨지 |

---

## 📁 프로젝트 구조

```
CuProductExpiry/
├── client/                    # React 프론트엔드
│   ├── src/
│   │   ├── components/        # 공통 컴포넌트
│   │   ├── pages/             # 페이지 컴포넌트
│   │   ├── services/          # API 클라이언트
│   │   ├── context/           # 인증 컨텍스트
│   │   └── styles/            # CSS
│   ├── public/                # 정적 파일 (PWA)
│   └── index.html
├── server/                    # Express 백엔드
│   ├── routes/                # API 라우트
│   ├── middleware/            # 인증 미들웨어
│   ├── db.js                  # SQLite 데이터베이스
│   ├── seed.js                # 시드 데이터
│   └── index.js               # 서버 진입점
├── package.json               # 루트 스크립트
└── .env                       # 환경 변수
```

---

## 📡 API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| `POST` | `/api/auth/login` | 로그인 |
| `GET` | `/api/auth/me` | 현재 사용자 정보 |
| `GET` | `/api/products` | 제품 목록 (검색/필터) |
| `GET` | `/api/products/expiring` | 기간별 소멸 제품 |
| `GET` | `/api/products/barcode/:code` | 바코드 조회 |
| `POST` | `/api/products` | 제품 추가 |
| `PUT` | `/api/products/:id` | 제품 수정 |
| `DELETE` | `/api/products/:id` | 제품 삭제 (소프트) |
| `GET` | `/api/categories/tree` | 카테고리 트리 |
| `GET` | `/api/dashboard/summary` | 대시보드 요약 |
| `GET` | `/api/dashboard/expiry-alerts` | 유통기한 알림 |
| `GET` | `/api/excel/export` | 엑셀 내보내기 |
| `POST` | `/api/excel/import` | 엑셀 가져오기 |

---

## 📊 유통기한 상태 기준

| 상태 | 기준 | 색상 |
|------|------|------|
| 🔴 유통기한 초과 | `expired` | `#dc3545` |
| 🟠 임박 | 0~3일 이내 | `#fd7e14` |
| 🟡 주의 | 4~14일 이내 | `#ffc107` |
| 🟢 여유 | 15~60일 이내 | `#28a745` |
| 🔵 신규 | 60일 초과 | `#17a2b8` |

---

## 📄 라이선스

MIT
