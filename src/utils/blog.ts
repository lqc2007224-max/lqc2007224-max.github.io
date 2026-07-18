import { slugify } from "./slug";

export interface LocalBlogPost {
  slug: string;
  title: string;
  summary: string;
  category: string;
  date: string;
  status: string;
  tags: string[];
  cover?: string;
  body: string;
  html: string;
  toc: BlogTocItem[];
  href: string;
}

export interface BlogTocItem {
  id: string;
  label: string;
  level: number;
}

const modules = import.meta.glob("../content/blog/*.md", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

function parseList(value = "") {
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }
  return trimmed
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseFrontmatter(raw: string) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/m.exec(raw);
  const data: Record<string, string> = {};
  const body = match ? match[2] : raw;
  if (match) {
    for (const line of match[1].split(/\r?\n/)) {
      const index = line.indexOf(":");
      if (index === -1) continue;
      const key = line.slice(0, index).trim();
      const value = line.slice(index + 1).trim().replace(/^["']|["']$/g, "");
      data[key] = value;
    }
  }
  return { data, body };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char] || char);
}

function inlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function plainText(value: string) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .trim();
}

function createHeadingId() {
  const used = new Map<string, number>();
  return (label: string) => {
    const base = slugify(plainText(label)) || "section";
    const count = used.get(base) || 0;
    used.set(base, count + 1);
    return count ? `${base}-${count + 1}` : base;
  };
}

export function extractMarkdownHeadings(markdown: string): BlogTocItem[] {
  const getId = createHeadingId();
  return markdown
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => /^(#{1,4})\s+(.+)$/.exec(line.trim()))
    .filter((match): match is RegExpExecArray => Boolean(match))
    .map((match) => {
      const label = plainText(match[2]);
      return {
        id: getId(match[2]),
        label,
        level: Math.min(match[1].length + 1, 5),
      };
    })
    .filter((item) => item.label && item.label !== "目录");
}

export function markdownToHtml(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  const getHeadingId = createHeadingId();

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!list.length) return;
    html.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
    list = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(trimmed);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length + 1;
      html.push(`<h${level} id="${getHeadingId(heading[2])}">${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const bullet = /^[-*]\s+(.+)$/.exec(trimmed);
    if (bullet) {
      flushParagraph();
      list.push(bullet[1]);
      continue;
    }

    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  return html.join("\n");
}

export function getLocalBlogPosts(): LocalBlogPost[] {
  return Object.entries(modules)
    .map(([path, raw]) => {
      const { data, body } = parseFrontmatter(raw);
      const fileName = path.split("/").pop()?.replace(/\.md$/, "") || slugify(data.title || "post");
      const title = data.title || fileName;
      const slug = data.slug || fileName || slugify(title);
      return {
        slug,
        title,
        summary: data.summary || body.split(/\r?\n/).find(Boolean) || "",
        category: data.category || "博客",
        date: data.date || "",
        status: data.status || "published",
        tags: parseList(data.tags),
        cover: data.cover,
        body,
        html: markdownToHtml(body),
        toc: extractMarkdownHeadings(body),
        href: `/blog/${slug}/`,
      };
    })
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}
