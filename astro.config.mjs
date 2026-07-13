import { defineConfig } from 'astro/config';

// 배포 후 Cloudflare Pages에서 실제 도메인으로 바꿔주세요 (예: https://yourname.pages.dev)
export default defineConfig({
  site: 'https://example.pages.dev',
  output: 'static',
});
