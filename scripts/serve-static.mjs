import { createReadStream, existsSync, statSync } from "node:fs";
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { basename, dirname, extname, join, normalize, resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const projectRoot = resolve(".");
const root = resolve("dist");
const publicRoot = resolve("public");
const desktopRoot = resolve("C:\\Users\\23676\\Desktop");
const port = Number.parseInt(process.env.PORT || "4321", 10);
const host = process.env.HOST || "127.0.0.1";

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

function buildMarkdown({ title, slug, summary, category, status, tags, coverPath, body }) {
  const date = new Date().toISOString().slice(0, 10);
  const tagText = Array.isArray(tags) ? tags.map((tag) => `"${escapeYaml(tag)}"`).join(", ") : "";
  return `---\ntitle: "${escapeYaml(title)}"\nslug: "${escapeYaml(slug)}"\nsummary: "${escapeYaml(summary)}"\ncategory: "${escapeYaml(category)}"\ndate: "${date}"\nstatus: "${escapeYaml(status)}"\ntags: [${tagText}]\n${coverPath ? `cover: "${escapeYaml(coverPath)}"\n` : ""}---\n\n${String(body || "").trim()}\n`;
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
    "& {",
    "param($zipPath, $targetPath)",
    "$ErrorActionPreference = 'Stop';",
    "Add-Type -AssemblyName System.IO.Compression.FileSystem;",
    "if (Test-Path -LiteralPath $targetPath) { Remove-Item -LiteralPath $targetPath -Recurse -Force }",
    "New-Item -ItemType Directory -Path $targetPath -Force | Out-Null;",
    "[System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $targetPath);",
    "}",
  ].join(" ");
  await execFileAsync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command, docxPath, extractDir], {
    windowsHide: true,
    maxBuffer: 1024 * 1024 * 8,
  });
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
    const docxPath = join(tempDir, fileName);
    const extractDir = join(tempDir, "extract");
    await mkdir(tempDir, { recursive: true });
    await writeFile(docxPath, decodeDataUrl(payload.dataUrl).buffer);
    try {
      await expandDocx(docxPath, extractDir);
    } catch {
      await rm(tempDir, { recursive: true, force: true });
      json(response, 400, { error: "这个文件无法作为 Word 文档解压。请确认它是正常保存的 .docx，不是 .doc 或 ~$ 开头的临时文件。" });
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

async function handlePublish(request, response) {
  try {
    const payload = await readJson(request);
    const title = String(payload.title || "").trim();
    if (!title) {
      json(response, 400, { error: "标题不能为空。" });
      return;
    }

    const slug = slugify(title);
    const category = String(payload.category || "博客").trim();
    const status = String(payload.status || "published").trim();
    const tags = Array.isArray(payload.tags) ? payload.tags.map((tag) => String(tag).trim()).filter(Boolean) : [];
    let body = String(payload.body || "").trim();
    const assetRelativeDir = join("assets", "blog", slug);
    const assetPublicDir = join(publicRoot, assetRelativeDir);
    await mkdir(assetPublicDir, { recursive: true });

    for (const asset of payload.assets || []) {
      const saved = await writeDataUrlFile(asset, assetPublicDir);
      await mirrorPublicAsset(join(assetRelativeDir, saved.name));
      body = body.replace(new RegExp(`/assets/blog/[^)\\s]+/${saved.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g"), `/assets/blog/${slug}/${saved.name}`);
    }

    let coverPath = "";
    if (payload.cover?.dataUrl) {
      const saved = await writeDataUrlFile(payload.cover, assetPublicDir);
      await mirrorPublicAsset(join(assetRelativeDir, saved.name));
      coverPath = `/assets/blog/${slug}/${saved.name}`;
    }

    const markdown = buildMarkdown({
      title,
      slug,
      summary: payload.summary || "",
      category,
      status,
      tags,
      coverPath,
      body,
    });

    const blogDir = join(projectRoot, "src", "content", "blog");
    await mkdir(blogDir, { recursive: true });
    await writeFile(join(blogDir, `${slug}.md`), markdown, "utf8");

    const defaultObsidianPath = join(desktopRoot, "obsidian", "Blog");
    const obsidianPath = String(payload.obsidianPath || defaultObsidianPath).trim();
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
    });
  } catch (error) {
    json(response, 500, { error: error.message || "发布失败。" });
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
  const pathname = new URL(request.url || "/", `http://${host}:${port}`).pathname;

  if (request.method === "POST" && pathname === "/api/admin/import-docx") {
    await handleImportDocx(request, response);
    return;
  }

  if (request.method === "POST" && pathname === "/api/admin/publish") {
    await handlePublish(request, response);
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
