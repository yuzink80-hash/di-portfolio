import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Project } from './types';
import { mockProjects } from './mock-data';

const NOTION_VERSION = '2022-06-28';

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9가-힣]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'project'
  );
}

function extractYouTubeId(url: string): string {
  if (!url) return '';
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return match ? match[1] : '';
}

function richText(prop: any): string {
  return (prop?.rich_text ?? []).map((t: any) => t.plain_text).join('');
}

function getTitle(props: any): string {
  // 제목(title) 칼럼 이름이 "Name"이 아니어도 동작하도록, 타입이 title인 속성을 찾습니다.
  for (const key in props) {
    if (props[key]?.type === 'title') {
      return props[key].title?.[0]?.plain_text ?? '제목 없음';
    }
  }
  return '제목 없음';
}

/**
 * Thumbnail 속성에서 이미지 출처를 찾습니다.
 * - 노션에 직접 업로드한 파일(type: 'file')은 1시간 후 만료되는 서명된 URL이라
 *   isExpiring: true로 표시해서 빌드 시 다운로드해두도록 합니다.
 * - 외부 링크(type: 'external')나 URL 속성은 만료되지 않으므로 그대로 씁니다.
 */
function getThumbnailSource(props: any): { url: string; isExpiring: boolean } | null {
  const thumbProp = props.Thumbnail;
  if (thumbProp?.type === 'files' && thumbProp.files?.[0]) {
    const f = thumbProp.files[0];
    if (f.type === 'file' && f.file?.url) {
      return { url: f.file.url, isExpiring: true };
    }
    if (f.type === 'external' && f.external?.url) {
      return { url: f.external.url, isExpiring: false };
    }
  }
  if (thumbProp?.type === 'url' && thumbProp.url) {
    return { url: thumbProp.url, isExpiring: false };
  }
  return null;
}

async function downloadThumbnail(url: string, slug: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    let ext = 'jpg';
    if (contentType.includes('png')) ext = 'png';
    else if (contentType.includes('webp')) ext = 'webp';
    else if (contentType.includes('gif')) ext = 'gif';

    const buffer = Buffer.from(await res.arrayBuffer());
    const fileName = `${slug}.${ext}`;

    // public/에 저장하면 `npm run dev`에서 바로 보이고,
    // dist/에도 저장해야 `npm run build` 최종 결과물에 남습니다
    // (public 폴더 복사가 페이지 생성보다 먼저 끝나기 때문).
    const targetDirs = [
      path.join(process.cwd(), 'public', 'thumbs'),
      path.join(process.cwd(), 'dist', 'thumbs'),
    ];
    for (const dir of targetDirs) {
      try {
        await mkdir(dir, { recursive: true });
        await writeFile(path.join(dir, fileName), buffer);
      } catch {
        // dist가 아직 없는 등 dev 서버 환경에서는 조용히 무시
      }
    }
    return `/thumbs/${fileName}`;
  } catch (err) {
    console.error(`[notion] 썸네일 다운로드 실패 (${slug}):`, err);
    return null;
  }
}

async function mapPageToProject(page: any): Promise<Project> {
  const props = page.properties ?? {};

  const title = getTitle(props);
  const client = richText(props.Client);
  const categories = (props.Category?.multi_select ?? []).map((c: any) => c.name);
  const year = props.Year?.number != null ? String(props.Year.number) : '';
  const videoUrl = props.VideoURL?.url ?? '';
  const videoId = extractYouTubeId(videoUrl);
  const description = richText(props.Description);
  const tools = richText(props.Tools);

  const slugProp = richText(props.Slug);
  const slug = slugProp.length > 0 ? slugProp : slugify(title);
  const featured = props.Featured?.checkbox === true;

  // 썸네일 결정: 노션 직접 업로드(만료 URL)는 빌드 시 로컬로 내려받아 영구 경로로 교체.
  const thumbSource = getThumbnailSource(props);
  let thumbnail: string;
  if (thumbSource?.isExpiring) {
    const downloaded = await downloadThumbnail(thumbSource.url, slug);
    thumbnail = downloaded ?? (videoId ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` : '/placeholder.jpg');
  } else if (thumbSource?.url) {
    thumbnail = thumbSource.url;
  } else {
    thumbnail = videoId ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` : '/placeholder.jpg';
  }

  return { slug, title, client, categories, year, videoUrl, videoId, thumbnail, description, tools, featured };
}

export async function getProjects(): Promise<Project[]> {
  const token = import.meta.env.NOTION_TOKEN;
  const dbId = import.meta.env.NOTION_DATABASE_ID;

  if (!token || !dbId) {
    console.warn('[notion] NOTION_TOKEN / NOTION_DATABASE_ID가 설정되지 않아 샘플 데이터로 빌드합니다.');
    return mockProjects;
  }

  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[notion] API 호출 실패, 샘플 데이터로 대체합니다:', errText);
      return mockProjects;
    }

    const data: any = await res.json();
    const projects: Project[] = await Promise.all((data.results ?? []).map(mapPageToProject));
    // Year 속성이 있으면 최신순으로 정렬 (없어도 에러 없이 그냥 원래 순서 유지)
    projects.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
    return projects.length > 0 ? projects : mockProjects;
  } catch (err) {
    console.error('[notion] 예외 발생, 샘플 데이터로 대체합니다:', err);
    return mockProjects;
  }
}
