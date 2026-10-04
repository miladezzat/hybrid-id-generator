import { defineConfig } from 'vitepress';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const { version } = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
export default defineConfig({
  title: 'Hybrid ID Generator',
  description: 'Configurable bigint identifiers for Node.js and browsers. Generate, encode, inspect, and expire IDs with an explicit machine field.',
  lang: 'en-US',
  base: '/hybrid-id-generator/',
  cleanUrls: false,
  outDir: fileURLToPath(new URL('../../docs', import.meta.url)),
  sitemap: { hostname: 'https://miladezzat.github.io/hybrid-id-generator/' },
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/hybrid-id-generator/logo.svg' }]],
  themeConfig: {
    logo: { src: '/logo.svg', alt: '' },
    nav: [
      { text: 'Guide', link: '/getting-started' },
      { text: 'API', link: '/api/generator', activeMatch: '^/api/' },
      { text: `v${version}`, items: [
        { text: 'Changelog', link: '/changelog' },
        { text: 'npm package', link: 'https://www.npmjs.com/package/hybrid-id-generator' },
        { text: 'Release guide', link: '/releasing' },
      ] },
    ],
    sidebar: [
      { text: 'Start here', items: [
        { text: 'Getting started', link: '/getting-started' },
        { text: 'Examples', link: '/examples' },
        { text: 'Node.js and browsers', link: '/compatibility' },
      ] },
      { text: 'Understand the IDs', items: [
        { text: 'Format and configuration', link: '/configuration' },
        { text: 'Uniqueness and clocks', link: '/uniqueness' },
        { text: 'Encoding and storage', link: '/encoding' },
        { text: 'Migration notes', link: '/migration' },
      ] },
      { text: 'API reference', items: [
        { text: 'HybridIDGenerator', link: '/api/generator' },
        { text: 'HybridID', link: '/api/id' },
        { text: 'Machine ID providers', link: '/api/providers' },
        { text: 'Utilities and types', link: '/api/helpers' },
      ] },
      { text: 'Project', collapsed: true, items: [
        { text: 'Contributing', link: '/contributing' },
        { text: 'Releasing and deployment', link: '/releasing' },
        { text: 'Changelog', link: '/changelog' },
        { text: 'License', link: '/license' },
      ] },
    ],
    search: { provider: 'local' },
    outline: [2, 3],
    socialLinks: [{ icon: 'github', link: 'https://github.com/miladezzat/hybrid-id-generator' }],
    editLink: { pattern: 'https://github.com/miladezzat/hybrid-id-generator/edit/main/documentation/:path', text: 'Improve this page' },
    footer: { message: 'Released under the MIT License.', copyright: 'Milad Fahmy' },
  },
});
