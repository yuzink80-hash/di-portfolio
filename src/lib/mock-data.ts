import type { Project } from './types';

// 노션 연동 전, 레이아웃 확인용 샘플 데이터입니다.
// NOTION_TOKEN / NOTION_DATABASE_ID를 설정하면 이 데이터 대신 실제 노션 DB 내용이 표시됩니다.
const PLACEHOLDER_VIDEO_ID = 'aqz-KE-bpKQ'; // Big Buck Bunny (CC 라이선스 데모 영상)

export const mockProjects: Project[] = [
  {
    slug: 'sample-cf-01',
    title: '샘플 광고 - 브랜드 필름',
    client: '가상 브랜드 A',
    categories: ['광고/CF'],
    year: '2026',
    videoUrl: `https://www.youtube.com/watch?v=${PLACEHOLDER_VIDEO_ID}`,
    videoId: PLACEHOLDER_VIDEO_ID,
    thumbnail: `https://i.ytimg.com/vi/${PLACEHOLDER_VIDEO_ID}/maxresdefault.jpg`,
    description: '이 항목은 예시입니다. 노션 데이터베이스를 연결하면 실제 작업물로 교체됩니다.',
    tools: 'DaVinci Resolve',
    featured: true,
  },
  {
    slug: 'sample-doc-01',
    title: '샘플 다큐멘터리',
    client: '가상 프로덕션 B',
    categories: ['다큐', '기타'],
    year: '2025',
    videoUrl: `https://www.youtube.com/watch?v=${PLACEHOLDER_VIDEO_ID}`,
    videoId: PLACEHOLDER_VIDEO_ID,
    thumbnail: `https://i.ytimg.com/vi/${PLACEHOLDER_VIDEO_ID}/maxresdefault.jpg`,
    description: '이 항목은 예시입니다. 노션 데이터베이스를 연결하면 실제 작업물로 교체됩니다.',
    tools: 'DaVinci Resolve, Baselight',
    featured: false,
  },
  {
    slug: 'sample-cf-02',
    title: '샘플 캠페인 필름',
    client: '가상 브랜드 C',
    categories: ['광고/CF'],
    year: '2025',
    videoUrl: `https://www.youtube.com/watch?v=${PLACEHOLDER_VIDEO_ID}`,
    videoId: PLACEHOLDER_VIDEO_ID,
    thumbnail: `https://i.ytimg.com/vi/${PLACEHOLDER_VIDEO_ID}/maxresdefault.jpg`,
    description: '이 항목은 예시입니다. 노션 데이터베이스를 연결하면 실제 작업물로 교체됩니다.',
    tools: 'DaVinci Resolve',
    featured: false,
  },
];
