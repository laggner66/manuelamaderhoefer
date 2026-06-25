import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE_ORIGIN = 'https://www.manuelamaderhoefer.com';
const ROUTES = [
  '/',
  '/koerpermethoden',
  '/angehoerige',
  '/jugendliche',
  '/erwachsene',
  '/preise',
  '/ueber-mich',
  '/kontakt',
  '/impressum',
  '/datenschutz',
];

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const archiveRoot = path.resolve(scriptDir, '..');
const siteDir = path.join(archiveRoot, 'site');
const renderedDir = path.join(archiveRoot, 'rendered-pages');
const screenshotsDir = path.join(archiveRoot, 'screenshots');
const reportsDir = path.join(archiveRoot, 'reports');
const rawDir = path.join(archiveRoot, 'raw-source');

const downloaded = [];
const errors = [];

function safeSegment(value) {
  return value
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'asset';
}

function routeSlug(route) {
  if (route === '/') return 'index';
  return route.replace(/^\/+/, '').replace(/[^\w.-]+/g, '_');
}

function extensionFromContentType(contentType) {
  if (!contentType) return '';
  if (contentType.includes('image/jpeg')) return '.jpg';
  if (contentType.includes('image/png')) return '.png';
  if (contentType.includes('image/webp')) return '.webp';
  if (contentType.includes('image/svg+xml')) return '.svg';
  if (contentType.includes('text/css')) return '.css';
  if (contentType.includes('javascript')) return '.js';
  if (contentType.includes('text/html')) return '.html';
  return '';
}

function assetTargetForUrl(rawUrl, contentType = '') {
  const url = new URL(rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl);
  const hash = createHash('sha1').update(url.href).digest('hex').slice(0, 10);
  const originalBase = path.posix.basename(url.pathname) || 'index';
  let ext = path.posix.extname(originalBase);
  let base = ext ? originalBase.slice(0, -ext.length) : originalBase;

  if (!ext) ext = extensionFromContentType(contentType);
  if (!ext) ext = '.bin';
  if (url.search) base = `${base}-${hash}`;

  const host = safeSegment(url.host);
  const dir = path.posix
    .dirname(url.pathname)
    .split('/')
    .filter(Boolean)
    .map(safeSegment)
    .join('/');
  const filename = `${safeSegment(base)}${ext}`;
  const relativeWebPath = ['external-assets', host, dir, filename].filter(Boolean).join('/');
  return {
    filePath: path.join(siteDir, relativeWebPath),
    webPath: `/${relativeWebPath}`,
  };
}

async function fetchBuffer(url) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const response = await fetch(url, {
        headers: {
          'user-agent': 'Mozilla/5.0 website-archive-script',
          accept: '*/*',
        },
        redirect: 'follow',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      const contentType = response.headers.get('content-type') || '';
      const buffer = Buffer.from(await response.arrayBuffer());
      return { buffer, contentType, finalUrl: response.url };
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
      }
    }
  }
  throw lastError;
}

async function writeBuffer(filePath, buffer) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);
}

async function download(url, filePath) {
  try {
    const result = await fetchBuffer(url);
    await writeBuffer(filePath, result.buffer);
    downloaded.push({
      url,
      savedAs: path.relative(archiveRoot, filePath),
      bytes: result.buffer.length,
      contentType: result.contentType,
      finalUrl: result.finalUrl,
    });
    return result;
  } catch (error) {
    errors.push({ url, error: error.message });
    return null;
  }
}

function extractHtmlAssets(html) {
  const matches = [...html.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)];
  return matches.map((match) => match[1]).filter((value) => value && !value.startsWith('#'));
}

function extractExternalAssetUrls(text) {
  const urls = new Set();
  const absolute = /https?:\/\/[^\s"'<>\\)]+/g;
  const protocolRelative = /\/\/(?:storage\.googleapis\.com|images\.unsplash\.com|images\.provenexpert\.com|www\.provenexpert\.com)\/[^\s"'<>\\)]+/g;
  const allowedHosts = new Set([
    'storage.googleapis.com',
    'images.unsplash.com',
    'images.provenexpert.com',
    'www.provenexpert.com',
    'www.googletagmanager.com',
  ]);

  for (const pattern of [absolute, protocolRelative]) {
    for (const match of text.matchAll(pattern)) {
      const raw = match[0].replace(/[;,.]+$/, '');
      try {
        const url = new URL(raw.startsWith('//') ? `https:${raw}` : raw);
        if (!allowedHosts.has(url.host)) continue;
        urls.add(raw);
      } catch {
        // Ignore non-URL matches from minified code.
      }
    }
  }
  return [...urls].sort();
}

function rewriteKnownUrls(text, replacements) {
  let rewritten = text;
  for (const [from, to] of replacements) {
    rewritten = rewritten.split(from).join(to);
    if (from.startsWith('https://')) {
      rewritten = rewritten.split(from.replace('https:', '')).join(to);
    }
  }
  return rewritten;
}

async function archiveStaticSite() {
  await mkdir(siteDir, { recursive: true });
  await mkdir(rawDir, { recursive: true });
  await mkdir(reportsDir, { recursive: true });

  const indexResult = await fetchBuffer(`${SOURCE_ORIGIN}/`);
  const indexHtml = indexResult.buffer.toString('utf8');
  await writeBuffer(path.join(rawDir, 'index.original.html'), indexResult.buffer);

  const localAssets = extractHtmlAssets(indexHtml)
    .map((asset) => {
      try {
        return new URL(asset, SOURCE_ORIGIN);
      } catch {
        return null;
      }
    })
    .filter((url) => url && url.origin === SOURCE_ORIGIN && url.pathname !== '/');

  const localAssetContents = new Map();
  for (const assetUrl of localAssets) {
    const target = path.join(siteDir, assetUrl.pathname);
    const result = await download(assetUrl.href, target);
    if (result && /\.(?:js|css|html)$/i.test(assetUrl.pathname)) {
      localAssetContents.set(assetUrl.pathname, result.buffer.toString('utf8'));
      await writeBuffer(path.join(rawDir, assetUrl.pathname), result.buffer);
    }
  }

  const discoveryText = [
    indexHtml,
    ...localAssetContents.values(),
  ].join('\n');
  const externalUrls = extractExternalAssetUrls(discoveryText);
  const replacements = new Map();

  for (const rawUrl of externalUrls) {
    try {
      const normalized = rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl;
      const result = await fetchBuffer(normalized);
      const target = assetTargetForUrl(normalized, result.contentType);
      await writeBuffer(target.filePath, result.buffer);
      downloaded.push({
        url: normalized,
        savedAs: path.relative(archiveRoot, target.filePath),
        bytes: result.buffer.length,
        contentType: result.contentType,
        finalUrl: result.finalUrl,
      });
      replacements.set(normalized, target.webPath);
      if (rawUrl.startsWith('//')) replacements.set(rawUrl, target.webPath);
    } catch (error) {
      errors.push({ url: rawUrl, error: error.message });
    }
  }

  const rewrittenIndex = rewriteKnownUrls(indexHtml, replacements);
  await writeBuffer(path.join(siteDir, 'index.html'), Buffer.from(rewrittenIndex));

  for (const [assetPath, content] of localAssetContents) {
    const rewritten = rewriteKnownUrls(content, replacements);
    await writeBuffer(path.join(siteDir, assetPath), Buffer.from(rewritten));
  }

  for (const route of ROUTES.filter((route) => route !== '/')) {
    await writeBuffer(path.join(siteDir, route.replace(/^\/+/, ''), 'index.html'), Buffer.from(rewrittenIndex));
  }

  await writeFile(path.join(siteDir, '_redirects'), '/* /index.html 200\n');

  return {
    source: SOURCE_ORIGIN,
    capturedAt: new Date().toISOString(),
    routes: ROUTES,
    localAssets: localAssets.map((url) => url.pathname),
    externalAssets: externalUrls,
  };
}

async function captureRenderedPages(manifest) {
  try {
    const { chromium } = await import('playwright');
    await mkdir(renderedDir, { recursive: true });
    await mkdir(screenshotsDir, { recursive: true });

    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1200 },
      deviceScaleFactor: 1,
    });

    async function revealAnimatedSections() {
      const viewportHeight = page.viewportSize()?.height || 900;
      const fullHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y <= fullHeight; y += Math.floor(viewportHeight * 0.75)) {
        await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
        await page.waitForTimeout(250);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
    }

    const snapshots = [];
    for (const route of ROUTES) {
      const url = `${SOURCE_ORIGIN}${route}`;
      const slug = routeSlug(route);
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        await page.waitForTimeout(3000);
        await revealAnimatedSections();
        const html = await page.content();
        const text = await page.evaluate(() => document.body.innerText);
        const metadata = await page.evaluate(() => ({
          title: document.title,
          description: document.querySelector('meta[name="description"]')?.content || '',
          h1: [...document.querySelectorAll('h1')].map((node) => node.innerText.trim()),
          links: [...document.querySelectorAll('a[href]')].map((node) => ({
            text: node.innerText.trim(),
            href: node.href,
          })),
          images: [...document.querySelectorAll('img')].map((node) => ({
            alt: node.alt,
            src: node.currentSrc || node.src,
          })),
        }));

        await writeFile(path.join(renderedDir, `${slug}.html`), html);
        await writeFile(path.join(renderedDir, `${slug}.txt`), text);
        await writeFile(path.join(renderedDir, `${slug}.metadata.json`), JSON.stringify(metadata, null, 2));
        await page.screenshot({ path: path.join(screenshotsDir, `${slug}.png`), fullPage: true });
        snapshots.push({
          route,
          html: path.relative(archiveRoot, path.join(renderedDir, `${slug}.html`)),
          text: path.relative(archiveRoot, path.join(renderedDir, `${slug}.txt`)),
          screenshot: path.relative(archiveRoot, path.join(screenshotsDir, `${slug}.png`)),
          title: metadata.title,
          h1: metadata.h1,
        });
      } catch (error) {
        errors.push({ url, error: `render failed: ${error.message}` });
      }
    }

    await browser.close();
    manifest.renderedSnapshots = snapshots;
  } catch (error) {
    errors.push({ url: 'playwright', error: error.message });
  }
}

async function main() {
  const manifest = await archiveStaticSite();
  await captureRenderedPages(manifest);
  manifest.downloaded = downloaded;
  manifest.errors = errors;
  await writeFile(path.join(reportsDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`Archive written to: ${archiveRoot}`);
  console.log(`Downloaded files: ${downloaded.length}`);
  console.log(`Errors: ${errors.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
