import type { Project } from './types';
import { mockProjects } from './mock-data';

const NOTION_VERSION = '2022-06-28';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'project';
}

function extractYouTubeId(url: string): string {
  if (!url) return '';
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return match ? match[1] : '';
}

function richText(prop: any): string {
  return (prop?.rich_text ?? []).map((t: any) => t.plain_text).join('');
}

function mapPageToProject(page: any): Project {
  const props = page.properties ?? {};

  const title = props.Name?.title?.[0]?.plain_text ?? '제목 없음';
  const client = richText(props.Client);
  const categories = (props.Category?.multi_select ?? []).map((c: any) => c.name);
  const year = props.Year?.number != null ? String(props.Year.number) : '';
  const videoUrl = props.VideoURL?.url ?? '';
  const videoId = extractYouTubeId(videoUrl);

  const uploadedThumb = props.Thumbnail?.files?.[0];
  const thumbFromNotion = uploadedThumb
    ? uploadedThumb.type === 'external'
      ? uploadedThumb.external?.url
      : uploadedThumb.file?.url
    : null;
  const thumbnail = thumbFromNotion || (videoId ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` : '/placeholder.jpg');

  const description = richText(props.Description);
  const tools = richText(props.Tools);

  const slugProp = richText(props.Slug);
  const slug = slugProp.length > 0 ? slugProp : slugify(title);

  return { slug, title, client, categories, year, videoUrl, videoId, thumbnail, description, tools };
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
      body: JSON.stringify({
        sorts: [{ property: 'Year', direction: 'descending' }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[notion] API 호출 실패, 샘플 데이터로 대체합니다:', errText);
      return mockProjects;
    }

    const data: any = await res.json();
    const projects = (data.results ?? []).map(mapPageToProject);
    return projects.length > 0 ? projects : mockProjects;
  } catch (err) {
    console.error('[notion] 예외 발생, 샘플 데이터로 대체합니다:', err);
    return mockProjects;
  }
}
