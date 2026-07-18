import { createReadStream, existsSync, mkdirSync, statSync } from "node:fs";
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { basename, dirname, extname, join, normalize, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const projectRoot = resolve(".");
const root = resolve("dist");
const publicRoot = resolve("public");
const desktopRoot = resolve("C:\\Users\\23676\\Desktop");
const dataRoot = resolve(".data");
const port = Number.parseInt(process.env.PORT || "4321", 10);
const host = process.env.HOST || "127.0.0.1";
const adminToken = String(process.env.ADMIN_TOKEN || "").trim();

mkdirSync(dataRoot, { recursive: true });
const db = new DatabaseSync(join(dataRoot, "cms.sqlite"));
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS posts (
    slug TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT '博客',
    status TEXT NOT NULL DEFAULT 'published',
    tags_json TEXT NOT NULL DEFAULT '[]',
    cover_path TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    obsidian_path TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    published_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_slug TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT '匿名访客',
    label TEXT NOT NULL DEFAULT '想法',
    message TEXT NOT NULL,
    approved INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_comments_post_slug ON comments(post_slug, created_at);
`);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".webp": "image/webp",
  ".wav": "audio/wav",
};

function slugify(value) {
  return String(value || "untitled")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "") || "untitled";
}

function sanitizeFileName(value) {
  const clean = basename(String(value || "asset")).replace(/[^\p{L}\p{N}._-]+/gu, "-");
  return clean || "asset";
}

function json(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 80 * 1024 * 1024) {
      throw new Error("请求太大，单次最多 80MB。");
    }
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function decodeDataUrl(dataUrl) {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(String(dataUrl || ""));
  if (!match) throw new Error("文件数据格式不正确。");
  return { mime: match[1], buffer: Buffer.from(match[2], "base64") };
}

function escapeYaml(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function buildMarkdown({ title, slug, summary, category, status, tags, coverPath, body, date }) {
  const displayDate = String(date || new Date().toISOString().slice(0, 10));
  const tagText = Array.isArray(tags) ? tags.map((tag) => `"${escapeYaml(tag)}"`).join(", ") : "";
  return `---\ntitle: "${escapeYaml(title)}"\nslug: "${escapeYaml(slug)}"\nsummary: "${escapeYaml(summary)}"\ncategory: "${escapeYaml(category)}"\ndate: "${displayDate}"\nstatus: "${escapeYaml(status)}"\ntags: [${tagText}]\n${coverPath ? `cover: "${escapeYaml(coverPath)}"\n` : ""}---\n\n${String(body || "").trim()}\n`;
}

function isLocalRequest(request) {
  const remote = request.socket.remoteAddress || "";
  return remote === "127.0.0.1" || remote === "::1" || remote === "::ffff:127.0.0.1";
}

function requireAdmin(request, response) {
  if (!adminToken && isLocalRequest(request)) return true;
  const supplied = request.headers["x-admin-token"] || "";
  if (String(supplied) === adminToken && adminToken) return true;
  json(response, 401, { error: "需要后台权限。请设置或填写 ADMIN_TOKEN。" });
  return false;
}

function parseTagsJson(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function serializePost(row) {
  if (!row) return null;
  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    category: row.category,
    status: row.status,
    tags: parseTagsJson(row.tags_json),
    coverPath: row.cover_path,
    body: row.body,
    obsidianPath: row.obsidian_path,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    href: `/blog/${row.slug}/`,
  };
}

function getDbPost(slug) {
  return serializePost(db.prepare("SELECT * FROM posts WHERE slug = ?").get(slug));
}

function listDbPosts() {
  return db
    .prepare("SELECT * FROM posts ORDER BY datetime(updated_at) DESC")
    .all()
    .map(serializePost);
}

async function writeDataUrlFile(asset, targetDir) {
  const name = sanitizeFileName(asset.name);
  const { buffer } = decodeDataUrl(asset.dataUrl);
  await mkdir(targetDir, { recursive: true });
  const target = join(targetDir, name);
  await writeFile(target, buffer);
  return { name, target };
}

async function mirrorPublicAsset(relativePath) {
  const source = join(publicRoot, relativePath);
  const target = join(root, relativePath);
  if (!existsSync(source)) return;
  await mkdir(dirname(target), { recursive: true });
  await copyFile(source, target);
}

async function runBuild() {
  const command = process.platform === "win32" ? "cmd.exe" : "npm";
  const args = process.platform === "win32" ? ["/d", "/s", "/c", "npm.cmd run build"] : ["run", "build"];
  await execFileAsync(command, args, {
    cwd: projectRoot,
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" },
    windowsHide: true,
    maxBuffer: 1024 * 1024 * 8,
  });
}

function decodeXml(value) {
  return String(value || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function extractText(xml) {
  return decodeXml(
    Array.from(xml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g))
      .map((match) => match[1])
      .join(""),
  ).trim();
}

function parseRelationships(xml) {
  const map = new Map();
  for (const match of xml.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)) {
    map.set(match[1], match[2]);
  }
  return map;
}

async function expandDocx(docxPath, extractDir) {
  const command = [
    "$ErrorActionPreference = 'Stop';",
    "$zipPath = $env:DOCX_ZIP_PATH;",
    "$targetPath = $env:DOCX_EXTRACT_DIR;",
    "Add-Type -AssemblyName System.IO.Compression.FileSystem;",
    "if (Test-Path -LiteralPath $targetPath) { Remove-Item -LiteralPath $targetPath -Recurse -Force }",
    "New-Item -ItemType Directory -Path $targetPath -Force | Out-Null;",
    "[System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $targetPath);",
  ].join(" ");
  await execFileAsync(
    "C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command],
    {
      env: {
        ...process.env,
        DOCX_ZIP_PATH: docxPath,
        DOCX_EXTRACT_DIR: extractDir,
      },
      windowsHide: true,
      maxBuffer: 1024 * 1024 * 8,
    },
  );
}

async function findFileBySuffix(baseDir, suffix) {
  const normalizedSuffix = normalize(suffix).toLowerCase();
  const entries = await readdir(baseDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(baseDir, entry.name);
    if (entry.isDirectory()) {
      const found = await findFileBySuffix(fullPath, normalizedSuffix);
      if (found) return found;
    } else if (normalize(fullPath).toLowerCase().endsWith(normalizedSuffix)) {
      return fullPath;
    }
  }
  return "";
}

async function handleImportDocx(request, response) {
  try {
    if (!requireAdmin(request, response)) return;
    const payload = await readJson(request);
    const originalFileName = String(payload.fileName || "document.docx");
    if (basename(originalFileName).startsWith("~$")) {
      json(response, 400, { error: "这个是 Word 临时锁文件，不是正文文档。请关闭 Word 后选择不带 ~$ 开头的 .docx 文件。" });
      return;
    }
    const fileName = sanitizeFileName(originalFileName);
    if (!fileName.toLowerCase().endsWith(".docx")) {
      json(response, 400, { error: "请导入 .docx 格式的 Word 文档。" });
      return;
    }
    const baseTitle = fileName.replace(/\.docx$/i, "");
    const slug = slugify(baseTitle);
    const tempDir = join(projectRoot, ".tmp", `docx-${Date.now()}`);
    const docxPath = join(tempDir, "source.docx");
    const extractDir = join(tempDir, "extract");
    await mkdir(tempDir, { recursive: true });
    await writeFile(docxPath, decodeDataUrl(payload.dataUrl).buffer);
    try {
      await expandDocx(docxPath, extractDir);
    } catch (error) {
      await rm(tempDir, { recursive: true, force: true });
      json(response, 400, {
        error: `这个文件无法作为 Word 文档解压：${error.stderr || error.message || "未知错误"}。请确认它是正常保存的 .docx，不是 .doc 或 ~$ 开头的临时文件。`,
      });
      return;
    }

    const documentXmlPath = await findFileBySuffix(extractDir, join("word", "document.xml"));
    if (!documentXmlPath) {
      await rm(tempDir, { recursive: true, force: true });
      json(response, 400, { error: "没有在 Word 文档里找到正文内容。请重新另存为 .docx 后再导入。" });
      return;
    }
    const documentDir = dirname(documentXmlPath);
    const documentXml = await readFile(documentXmlPath, "utf8");
    const relsPath = join(documentDir, "_rels", "document.xml.rels");
    const relsXml = existsSync(relsPath) ? await readFile(relsPath, "utf8") : "";
    const relationships = parseRelationships(relsXml);
    const assetRelativeDir = join("assets", "blog", slug);
    const assetPublicDir = join(publicRoot, assetRelativeDir);
    await mkdir(assetPublicDir, { recursive: true });

    const paragraphs = Array.from(documentXml.matchAll(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g)).map((match) => match[0]);
    const markdown = [];

    for (const paragraph of paragraphs) {
      const text = extractText(paragraph);
      const styleMatch = /<w:pStyle[^>]*w:val="([^"]+)"/.exec(paragraph);
      const style = styleMatch?.[1] || "";
      const imageIds = Array.from(paragraph.matchAll(/r:embed="([^"]+)"/g)).map((match) => match[1]);

      if (text) {
        if (/Heading1|Title/i.test(style)) markdown.push(`# ${text}`);
        else if (/Heading2/i.test(style)) markdown.push(`## ${text}`);
        else if (/Heading3/i.test(style)) markdown.push(`### ${text}`);
        else markdown.push(text);
      }

      for (const id of imageIds) {
        const target = relationships.get(id);
        if (!target) continue;
        const source = target.startsWith("/")
          ? join(extractDir, target.replace(/^\//, ""))
          : join(documentDir, target);
        if (!existsSync(source)) continue;
        const imageName = sanitizeFileName(basename(target));
        const imageTarget = join(assetPublicDir, imageName);
        await copyFile(source, imageTarget);
        await mirrorPublicAsset(join(assetRelativeDir, imageName));
        markdown.push(`![${imageName}](/assets/blog/${slug}/${imageName})`);
      }
    }

    await rm(tempDir, { recursive: true, force: true });
    const firstParagraph = markdown.find((line) => line && !line.startsWith("#") && !line.startsWith("![")) || "";
    json(response, 200, {
      title: baseTitle,
      summary: firstParagraph.slice(0, 120),
      markdown: markdown.join("\n\n"),
    });
  } catch (error) {
    json(response, 500, { error: error.message || "Word 导入失败。" });
  }
}

async function handleListPosts(request, response) {
  if (!requireAdmin(request, response)) return;
  json(response, 200, { posts: listDbPosts() });
}

async function handleGetPost(request, response, slug) {
  if (!requireAdmin(request, response)) return;
  const post = getDbPost(slug);
  if (!post) {
    json(response, 404, { error: "没有找到这篇文章。" });
    return;
  }
  json(response, 200, { post });
}

async function handlePublish(request, response) {
  try {
    if (!requireAdmin(request, response)) return;
    const payload = await readJson(request);
    const title = String(payload.title || "").trim();
    if (!title) {
      json(response, 400, { error: "标题不能为空。" });
      return;
    }

    const requestedSlug = payload.slug ? slugify(payload.slug) : "";
    const slug = requestedSlug || slugify(title);
    const category = String(payload.category || "博客").trim();
    const status = String(payload.status || "published").trim();
    const tags = Array.isArray(payload.tags) ? payload.tags.map((tag) => String(tag).trim()).filter(Boolean) : [];
    let body = String(payload.body || "").trim();
    const existing = getDbPost(slug);
    const assetRelativeDir = join("assets", "blog", slug);
    const assetPublicDir = join(publicRoot, assetRelativeDir);
    await mkdir(assetPublicDir, { recursive: true });

    for (const asset of payload.assets || []) {
      const saved = await writeDataUrlFile(asset, assetPublicDir);
      await mirrorPublicAsset(join(assetRelativeDir, saved.name));
      body = body.replace(new RegExp(`/assets/blog/[^)\\s]+/${saved.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g"), `/assets/blog/${slug}/${saved.name}`);
    }

    let coverPath = String(payload.coverPath || existing?.coverPath || "");
    if (payload.cover?.dataUrl) {
      const saved = await writeDataUrlFile(payload.cover, assetPublicDir);
      await mirrorPublicAsset(join(assetRelativeDir, saved.name));
      coverPath = `/assets/blog/${slug}/${saved.name}`;
    }

    const now = new Date().toISOString();
    const publishedAt = existing?.publishedAt || now.slice(0, 10);
    const obsidianPath = String(payload.obsidianPath || existing?.obsidianPath || join(desktopRoot, "obsidian", "Blog")).trim();

    const markdown = buildMarkdown({
      title,
      slug,
      summary: payload.summary || "",
      category,
      status,
      tags,
      coverPath,
      body,
      date: publishedAt.slice(0, 10),
    });

    const blogDir = join(projectRoot, "src", "content", "blog");
    await mkdir(blogDir, { recursive: true });
    await writeFile(join(blogDir, `${slug}.md`), markdown, "utf8");

    if (obsidianPath) {
      const resolvedObsidianPath = resolve(obsidianPath);
      if (!resolvedObsidianPath.startsWith(desktopRoot)) {
        json(response, 400, { error: "为了安全，Obsidian 同步目录必须在桌面目录下。" });
        return;
      }
      await mkdir(resolvedObsidianPath, { recursive: true });
      const obsidianAssetDir = join(resolvedObsidianPath, "assets", slug);
      await mkdir(obsidianAssetDir, { recursive: true });
      for (const asset of payload.assets || []) {
        const name = sanitizeFileName(asset.name);
        const source = join(assetPublicDir, name);
        if (existsSync(source)) await copyFile(source, join(obsidianAssetDir, name));
      }
      if (coverPath) {
        const coverName = basename(coverPath);
        const source = join(assetPublicDir, coverName);
        if (existsSync(source)) await copyFile(source, join(obsidianAssetDir, coverName));
      }
      const obsidianMarkdown = markdown.replaceAll(`/assets/blog/${slug}/`, `assets/${slug}/`);
      await writeFile(join(resolvedObsidianPath, `${slug}.md`), obsidianMarkdown, "utf8");
    }

    db.prepare(`
      INSERT INTO posts (
        slug, title, summary, category, status, tags_json, cover_path, body,
        obsidian_path, created_at, updated_at, published_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        title = excluded.title,
        summary = excluded.summary,
        category = excluded.category,
        status = excluded.status,
        tags_json = excluded.tags_json,
        cover_path = excluded.cover_path,
        body = excluded.body,
        obsidian_path = excluded.obsidian_path,
        updated_at = excluded.updated_at,
        published_at = excluded.published_at
    `).run(
      slug,
      title,
      String(payload.summary || ""),
      category,
      status,
      JSON.stringify(tags),
      coverPath,
      body,
      obsidianPath,
      existing?.createdAt || now,
      now,
      publishedAt,
    );

    let rebuild = "skipped";
    if (payload.rebuild !== false) {
      await runBuild();
      rebuild = "done";
    }

    json(response, 200, {
      ok: true,
      slug,
      href: `/blog/${slug}/`,
      markdownPath: `src/content/blog/${slug}.md`,
      rebuild,
      post: getDbPost(slug),
    });
  } catch (error) {
    json(response, 500, { error: error.message || "发布失败。" });
  }
}

async function handleDeletePost(request, response, slug) {
  try {
    if (!requireAdmin(request, response)) return;
    const post = getDbPost(slug);
    db.prepare("DELETE FROM posts WHERE slug = ?").run(slug);
    db.prepare("DELETE FROM comments WHERE post_slug = ?").run(slug);
    await rm(join(projectRoot, "src", "content", "blog", `${slug}.md`), { force: true });

    let rebuild = "skipped";
    if (post) {
      await runBuild();
      rebuild = "done";
    }
    json(response, 200, { ok: true, slug, rebuild });
  } catch (error) {
    json(response, 500, { error: error.message || "删除失败。" });
  }
}

async function handleListComments(request, response, url) {
  const rawPostSlug = String(url.searchParams.get("post") || "").trim();
  const postSlug = rawPostSlug ? slugify(rawPostSlug) : "";
  if (!postSlug) {
    json(response, 400, { error: "缺少文章 slug。" });
    return;
  }
  const comments = db
    .prepare("SELECT id, author, label, message, created_at FROM comments WHERE post_slug = ? AND approved = 1 ORDER BY id DESC LIMIT 120")
    .all(postSlug)
    .map((row) => ({
      id: row.id,
      author: row.author,
      label: row.label,
      message: row.message,
      date: row.created_at,
    }));
  json(response, 200, { comments });
}

async function handleCreateComment(request, response) {
  try {
    const payload = await readJson(request);
    const rawPostSlug = String(payload.postSlug || payload.post || "").trim();
    const postSlug = rawPostSlug ? slugify(rawPostSlug) : "";
    const message = String(payload.message || "").trim();
    if (!postSlug || !message) {
      json(response, 400, { error: "评论内容不能为空。" });
      return;
    }
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO comments (post_slug, author, label, message, approved, created_at)
      VALUES (?, ?, ?, ?, 1, ?)
    `).run(
      postSlug,
      String(payload.author || "").trim() || "匿名访客",
      String(payload.label || "想法").trim() || "想法",
      message.slice(0, 5000),
      now,
    );
    json(response, 200, {
      ok: true,
      comment: {
        id: Number(result.lastInsertRowid),
        author: String(payload.author || "").trim() || "匿名访客",
        label: String(payload.label || "想法").trim() || "想法",
        message: message.slice(0, 5000),
        date: now,
      },
    });
  } catch (error) {
    json(response, 500, { error: error.message || "评论发布失败。" });
  }
}

function pipeFile(filePath, response, options) {
  const stream = createReadStream(filePath, options);

  stream.on("error", () => {
    if (!response.headersSent) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    }
    response.end("Read error");
  });

  response.on("error", () => {
    stream.destroy();
  });

  response.on("close", () => {
    if (!response.writableEnded) {
      stream.destroy();
    }
  });

  stream.pipe(response);
}

function resolveRequest(url) {
  const pathname = decodeURIComponent(new URL(url, `http://${host}:${port}`).pathname);
  const cleanPath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  let filePath = resolve(join(root, cleanPath));

  if (!filePath.startsWith(root)) {
    return null;
  }

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, "index.html");
  }

  if (!existsSync(filePath) && extname(filePath)) {
    return { filePath, missing: true };
  }

  if (!existsSync(filePath)) {
    filePath = join(root, "index.html");
  }

  return { filePath, missing: false };
}

createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${host}:${port}`);
  const pathname = url.pathname;

  if (request.method === "POST" && pathname === "/api/admin/import-docx") {
    await handleImportDocx(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/admin/posts") {
    await handleListPosts(request, response);
    return;
  }

  const postMatch = /^\/api\/admin\/posts\/([^/]+)$/.exec(pathname);
  if (postMatch && request.method === "GET") {
    await handleGetPost(request, response, decodeURIComponent(postMatch[1]));
    return;
  }

  if (postMatch && request.method === "DELETE") {
    await handleDeletePost(request, response, decodeURIComponent(postMatch[1]));
    return;
  }

  if (request.method === "POST" && pathname === "/api/admin/publish") {
    await handlePublish(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/comments") {
    await handleListComments(request, response, url);
    return;
  }

  if (request.method === "POST" && pathname === "/api/comments") {
    await handleCreateComment(request, response);
    return;
  }

  const result = resolveRequest(request.url || "/");
  if (!result) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  const { filePath, missing } = result;
  if (missing) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const type = contentTypes[extname(filePath)] || "application/octet-stream";
  const { size } = statSync(filePath);
  const range = request.headers.range;

  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (match) {
      const start = match[1] ? Number.parseInt(match[1], 10) : 0;
      const end = match[2] ? Number.parseInt(match[2], 10) : size - 1;
      const safeEnd = Math.min(end, size - 1);

      if (start <= safeEnd && start < size) {
        response.writeHead(206, {
          "Accept-Ranges": "bytes",
          "Content-Length": safeEnd - start + 1,
          "Content-Range": `bytes ${start}-${safeEnd}/${size}`,
          "Content-Type": type,
        });
        pipeFile(filePath, response, { start, end: safeEnd });
        return;
      }
    }

    response.writeHead(416, {
      "Content-Range": `bytes */${size}`,
    });
    response.end();
    return;
  }

  response.writeHead(200, {
    "Accept-Ranges": "bytes",
    "Content-Length": size,
    "Content-Type": type,
  });
  pipeFile(filePath, response);
}).listen(port, host, () => {
  console.log(`Static preview running at http://${host}:${port}/`);
  console.log(`Writing studio available at http://${host}:${port}/admin/`);
});
