# DI 포트폴리오 사이트

노션을 콘텐츠 관리(CMS)로 쓰고, Astro로 빌드해서 Cloudflare Pages에 무료로 배포하는 구조입니다.
지금 상태로 바로 실행하면 샘플(더미) 데이터로 레이아웃을 확인할 수 있고, 노션을 연결하면 실제 작업물로 자동 교체됩니다.

---

## 0. 미리보기 (지금 바로 확인)

```
npm install
npm run dev
```

터미널에 뜨는 주소(보통 http://localhost:4321)로 접속하면 샘플 데이터로 채워진 포트폴리오를 볼 수 있어요.

---

## 1. 노션 데이터베이스 만들기

노션에서 새 페이지 → "표(데이터베이스) - 전체 페이지"로 데이터베이스를 만들고, 아래 속성(property)을 정확히 이 이름으로 추가하세요.

| 속성 이름 | 타입 | 설명 |
|---|---|---|
| Name | 제목(Title) | 프로젝트명 (제목 칼럼 이름은 자유롭게 바꿔도 자동 인식됩니다) |
| Client | 텍스트 | 클라이언트/브랜드명 |
| Category | 다중 선택 | 예: 광고/CF, 다큐, 기타 |
| Year | 숫자 | 작업 연도 |
| VideoURL | URL | YouTube 영상 링크 |
| Thumbnail | 파일과 미디어 | (선택) 커스텀 썸네일. 비워두면 YouTube 썸네일을 자동으로 씁니다 |
| Description | 텍스트 | 작업 소개 짧은 설명 |
| Tools | 텍스트 | 사용 툴 (예: DaVinci Resolve, Baselight) |
| Slug | 텍스트 | (선택) URL 주소. 비워두면 제목으로 자동 생성 |
| Featured | 체크박스 | (선택) 대표작으로 홈 화면에 크게 강조. 아무것도 체크 안 하면 최신 작업물이 자동으로 대표작이 됩니다 |

프로젝트를 하나씩 행(row)으로 추가하면 됩니다.

---

## 2. 노션 인테그레이션 토큰 발급

1. https://www.notion.so/profile/integrations 접속
2. "새 인테그레이션" 클릭 → 이름 아무거나 (예: portfolio-site) → 저장
3. 발급된 토큰(`ntn_` 또는 `secret_`로 시작하는 문자열) 복사
4. 방금 만든 데이터베이스 페이지로 가서 우측 상단 "..." → "연결 추가" → 방금 만든 인테그레이션 선택 (이 단계를 안 하면 API가 데이터를 못 읽어옵니다)
5. 데이터베이스를 "전체 페이지로 열기"한 상태의 URL에서 32자리 문자열(하이픈 없이 이어진 부분)이 Database ID 입니다.

---

## 3. 로컬에서 실제 데이터로 확인

`.env.example`을 복사해서 `.env` 파일을 만들고 값을 채우세요.

```
NOTION_TOKEN=ntn_여기에_토큰
NOTION_DATABASE_ID=여기에_데이터베이스ID
```

다시 `npm run dev`로 실행하면 샘플 데이터 대신 실제 노션 내용이 보입니다.

---

## 4. GitHub에 올리기

```
git init
git add .
git commit -m "portfolio init"
```

GitHub에서 새 저장소를 만들고 안내에 따라 push 하세요. (`.env`는 `.gitignore`에 포함되어 있어 토큰이 실수로 올라가지 않습니다.)

터미널이 익숙하지 않다면, GitHub 저장소 페이지의 "Add file → Upload files"로 폴더째 드래그 앤 드롭해도 됩니다.

---

## 5. Cloudflare Pages 연결 (무료 배포)

1. https://dash.cloudflare.com 에서 계정 생성/로그인
2. "Ship something new" → Create app → "Looking to deploy Pages? Get started" → Import an existing Git repository
3. GitHub 저장소 선택
4. Project name, 빌드 설정
   - 빌드 명령어: `npm run build`
   - 빌드 출력 디렉터리: `dist`
5. "Environment variables"에 `NOTION_TOKEN`, `NOTION_DATABASE_ID`를 각각 추가
6. 배포 시작 → 완료되면 `프로젝트명.pages.dev` 주소로 바로 접속 가능

이후 노션에 프로젝트 행을 추가/수정한 뒤, Cloudflare Pages 대시보드의 "Retry deployment"를 누르면 재빌드되어 반영됩니다.

---

## 폴더 구조

```
src/
  lib/
    notion.ts      노션 API 호출 + 목업 데이터 폴백 + 썸네일 영구 저장
    mock-data.ts   샘플 데이터 (노션 연결 전 미리보기용)
    types.ts       Project 타입 정의
  components/
    ProjectCard.astro   목록 카드 (재생 버튼, 대표작 강조 지원)
    VideoEmbed.astro    클릭 시에만 iframe을 삽입하는 lazy-load 영상 플레이어
  layouts/
    Layout.astro   공통 HTML 골격, 다크 + 틸-오렌지 테마
  pages/
    index.astro          홈 (그리드 + 대표작 강조)
    project/[slug].astro 프로젝트 상세 페이지
  styles/
    global.css     전체 스타일
```

## 커스터마이징 팁

- 색상: `src/styles/global.css` 상단 `:root` 변수(`--accent-warm`, `--accent-cool` 등)만 바꾸면 전체 톤이 바뀝니다.
- 카테고리 추가/변경: 노션 Category 속성에 옵션만 추가하면 자동 반영됩니다 (코드 수정 불필요).
- Vimeo를 쓰고 싶다면: `src/lib/notion.ts`의 `extractYouTubeId` 함수와 `VideoEmbed.astro`의 iframe 주소를 Vimeo 임베드 형식으로 바꾸면 됩니다.
