"use client";

import * as React from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { FileUpload, type FileUploadItem } from "@/components/primitives/file-upload";
import { SelectField } from "@/components/primitives/select-field";
import { TextField } from "@/components/primitives/text-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  type BlogPost,
  type BlogRole,
  blogDeskSchema,
  blogPostSchema,
  blogPublishRequestSchema,
} from "@/constant/schemas/admin-blog";
import { inspectMedia, previewAssetUrl } from "@/lib/media-preview";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cn } from "cn";
import Link from "next/link";
import { toast } from "sonner";

import { Notice } from "../_operations/ui";
import { usePreviewState } from "../_operations/use-preview-state";
import { FilterChips, SegmentBar, StatusPill, formatDate, toneBar, toneDot } from "../account/page";
import { CardHeader } from "../content/page";
import { BLOG_CATEGORIES, BLOG_DESK } from "./_data";

const STATUS_TONE = { draft: "muted", published: "success", archived: "warning" } as const;
const POST_STATUSES = ["draft", "published", "archived"] as const;
const EMPTY: BlogPost = {
  id: "",
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  category: BLOG_CATEGORIES[0],
  tags: [],
  status: "draft",
  updatedAt: "2026-11-08T12:00:00+01:00",
};

const slugify = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const toHtml = (body: string) => {
  const trimmed = body.trim();
  if (trimmed.startsWith("<")) return body;
  return trimmed
    .split(/\n\n+/)
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p>`)
    .join("");
};

const EDITOR =
  "min-h-[28rem] px-6 py-5 text-[15px] leading-7 outline-none [&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-foreground/15 [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5";

function PostComposer({
  initial,
  canPublish,
  onSave,
}: {
  initial: BlogPost;
  canPublish: boolean;
  onSave: (post: BlogPost) => boolean;
}) {
  const [post, setPost] = React.useState(initial);
  const [tags, setTags] = React.useState(initial.tags.join(", "));
  const [cover, setCover] = React.useState<FileUploadItem[]>(
    initial.coverName
      ? [{ id: "cover", name: initial.coverName, size: initial.coverName.length, status: "completed" }]
      : []
  );
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: toHtml(initial.body),
    editorProps: { attributes: { class: EDITOR } },
  });

  const commit = (status: BlogPost["status"]) => {
    const text = editor?.getText().trim() ?? "";
    if (!text) {
      toast.error("Write the post");
      return;
    }
    const saved = onSave({
      ...post,
      id: post.id || `CC-B${Date.now().toString().slice(-4)}`,
      slug: post.slug || slugify(post.title),
      body: editor?.getHTML() ?? "",
      tags: tags
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      coverName: cover[0]?.name,
      coverUrl: cover[0] ? post.coverUrl : undefined,
      status,
      updatedAt: "2026-11-08T12:00:00+01:00",
    });
    if (saved) AppModal.close();
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0">
        <input
          value={post.title}
          onChange={(event) => {
            const title = event.target.value;
            setPost((current) => ({ ...current, title, slug: current.id ? current.slug : slugify(title) }));
          }}
          placeholder="Story title"
          className="w-full bg-transparent text-4xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/50"
        />
        <div className="mt-6 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
          <div className="flex flex-wrap gap-1 border-b border-border px-2 py-2">
            {(
              [
                ["Bold", () => editor?.chain().focus().toggleBold().run(), editor?.isActive("bold")],
                ["Italic", () => editor?.chain().focus().toggleItalic().run(), editor?.isActive("italic")],
                [
                  "Heading",
                  () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
                  editor?.isActive("heading", { level: 2 }),
                ],
                ["List", () => editor?.chain().focus().toggleBulletList().run(), editor?.isActive("bulletList")],
                ["Numbered", () => editor?.chain().focus().toggleOrderedList().run(), editor?.isActive("orderedList")],
                ["Quote", () => editor?.chain().focus().toggleBlockquote().run(), editor?.isActive("blockquote")],
              ] as const
            ).map(([label, run, active]) => (
              <button
                key={label}
                type="button"
                onClick={run}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <EditorContent editor={editor} />
        </div>
      </div>

      <aside className="lg:sticky lg:top-0">
        <Card className="gap-0 rounded-2xl py-0 ring-foreground/8">
          <div className="border-b border-border p-5">
            <CardHeader title="Details" note="Web address, category, tags and cover" />
          </div>
          <div className="flex flex-col gap-4 p-5">
            <TextField
              id="post-slug"
              label="Web address"
              value={post.slug}
              onChange={(slug) => setPost({ ...post, slug })}
            />
            <SelectField
              id="post-category"
              label="Category"
              value={post.category}
              onChange={(category) => setPost({ ...post, category })}
              items={BLOG_CATEGORIES.map((item) => ({ value: item, label: item }))}
            />
            <TextField
              id="post-tags"
              label="Tags"
              helpText="Separate tags with commas."
              value={tags}
              onChange={setTags}
            />
            <TextField
              id="post-excerpt"
              label="Excerpt"
              value={post.excerpt}
              onChange={(excerpt) => setPost({ ...post, excerpt })}
            />
            <FileUpload
              id="post-cover"
              label="Cover"
              title="Add a cover image"
              description="JPEG, PNG or WebP, up to 5 MB."
              items={cover}
              dropzoneAccept={{ "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"] }}
              dropzoneMaxSize={5_000_000}
              dropzoneMultiple={false}
              onFilesAdded={(files) => {
                const file = files[0];
                if (!file) return;
                const checked = inspectMedia(file.type, file.size);
                if (!checked.ok || checked.folder !== "images") {
                  toast.error(checked.ok ? "Use a JPEG, PNG or WebP" : checked.message);
                  return;
                }
                const id = `CV-${Date.now().toString().slice(-6)}`;
                setCover([{ id, name: file.name, size: file.size, status: "completed" }]);
                setPost((current) => ({ ...current, coverName: file.name, coverUrl: previewAssetUrl("images", id) }));
              }}
              onFilesRejected={() => toast.error("Use a JPEG, PNG or WebP up to 5 MB")}
              onRemove={() => {
                setCover([]);
                setPost((current) => ({ ...current, coverName: undefined, coverUrl: undefined }));
              }}
            />
            {!canPublish ? <Notice>This role can save a draft. An editor publishes.</Notice> : null}
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-border bg-muted/40 p-5">
            <Button type="button" variant="ghost" className="h-10 rounded-full px-4" onClick={() => AppModal.close()}>
              Cancel
            </Button>
            <Button type="button" variant="outline" className="h-10 rounded-full px-4" onClick={() => commit("draft")}>
              Save draft
            </Button>
            <Button
              type="button"
              className="h-10 rounded-full px-5"
              disabled={!canPublish}
              onClick={() => commit("published")}
            >
              Publish
            </Button>
          </div>
        </Card>
      </aside>
    </div>
  );
}

export default function BlogPage() {
  const desk = usePreviewState("citycore.admin.blog", blogDeskSchema, BLOG_DESK);
  const deskRef = React.useRef(desk);
  React.useEffect(() => {
    deskRef.current = desk;
  });
  const [status, setStatus] = React.useState<"all" | BlogPost["status"]>("all");
  const [category, setCategory] = React.useState("all");
  const [tag, setTag] = React.useState("all");

  const role = desk.value.role;
  const posts = desk.value.posts.filter((post) => status === "all" || post.status === status);
  const tagsInUse = [...new Set(desk.value.posts.flatMap((post) => post.tags))];
  const published = desk.value.posts.filter(
    (post) =>
      post.status === "published" &&
      (category === "all" || post.category === category) &&
      (tag === "all" || post.tags.includes(tag))
  );

  const savePosts = (next: BlogPost[], message: string) => {
    if (desk.save({ ...desk.value, posts: next })) toast.success(message);
  };

  const openComposer = (initial: BlogPost) => {
    AppModal.open({
      title: initial.id ? "Edit story" : "New story",
      description: "The full page is for the story. Details and the cover sit on the side.",
      size: "full",
      content: (
        <PostComposer
          initial={initial}
          canPublish={deskRef.current.value.role === "editor"}
          onSave={(next) => {
            const current = deskRef.current;
            if (
              next.status === "published" &&
              !blogPublishRequestSchema.safeParse({ role: current.value.role, status: "published" }).success
            ) {
              toast.error("Media & Publicity can only save drafts");
              return false;
            }
            const parsed = blogPostSchema.safeParse(next);
            if (!parsed.success) {
              toast.error(parsed.error.issues[0].message);
              return false;
            }
            const list = current.value.posts;
            const exists = list.some((item) => item.id === parsed.data.id);
            const saved = current.save({
              ...current.value,
              posts: exists
                ? list.map((item) => (item.id === parsed.data.id ? parsed.data : item))
                : [parsed.data, ...list],
            });
            if (saved) toast.success(parsed.data.status === "published" ? "Post published" : "Draft saved");
            return saved;
          }}
        />
      ),
    });
  };

  const count = (value: (typeof POST_STATUSES)[number]) =>
    desk.value.posts.filter((post) => post.status === value).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Blog</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stories open in a full-screen editor. Readers only see what an editor has published.
          </p>
        </div>
        <Button className="h-10 rounded-full px-5" onClick={() => openComposer(EMPTY)}>
          New post
        </Button>
      </div>

      <section className="relative flex flex-col gap-6 overflow-hidden rounded-2xl bg-[#121212] p-6 text-white ring-1 ring-white/10">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-accent/25 blur-3xl"
        />
        <div className="relative">
          <p className="text-sm text-white/60">Posts</p>
          <p className="mt-2 text-4xl font-light tabular-nums md:text-5xl">{desk.value.posts.length}</p>
        </div>
        <div className="relative flex flex-col gap-2.5">
          <SegmentBar
            className="h-2.5 bg-white/10"
            parts={POST_STATUSES.map((value) => ({
              key: value,
              value: count(value),
              className: value === "published" ? "bg-accent" : toneBar(STATUS_TONE[value]),
            }))}
          />
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {POST_STATUSES.map((value) => (
              <p key={value} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={cn(
                    "size-2 rounded-full",
                    value === "published" ? "bg-accent" : toneDot(STATUS_TONE[value])
                  )}
                />
                <span className="text-white/60 capitalize">{value}</span>
                <span className="font-semibold tabular-nums">{count(value)}</span>
              </p>
            ))}
          </div>
        </div>
      </section>

      {role === "media-publicity" ? <Notice>This role can write and save drafts. An editor publishes.</Notice> : null}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <CardHeader title="Posts" note="Drafts stay here until an editor publishes" />
            <SelectField
              id="blog-role"
              label="Acting as"
              value={role}
              onChange={(value) => desk.save({ ...desk.value, role: value as BlogRole })}
              items={[
                { value: "editor", label: "Editor" },
                { value: "media-publicity", label: "Media & Publicity" },
              ]}
              className="w-56"
            />
          </div>
          <FilterChips
            label="Post status"
            value={status}
            onChange={setStatus}
            options={(["all", ...POST_STATUSES] as const).map((value) => ({
              value,
              label: value === "all" ? "All" : value[0].toUpperCase() + value.slice(1),
              count: value === "all" ? desk.value.posts.length : count(value),
            }))}
          />
          <ul className="flex flex-col">
            {posts.map((post) => (
              <li
                key={post.id}
                className="flex flex-wrap items-center gap-3 border-b border-border py-3 last:border-none"
              >
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => openComposer(post)}>
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">{post.title}</span>
                    <StatusPill tone={STATUS_TONE[post.status]}>{post.status}</StatusPill>
                  </span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">
                    /blog/{post.slug} · {post.category} · {formatDate(post.updatedAt)}
                  </span>
                </button>
                <Button type="button" variant="outline" className="h-8 rounded-full" onClick={() => openComposer(post)}>
                  Edit
                </Button>
                {post.status === "published" ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 rounded-full"
                    onClick={() =>
                      savePosts(
                        desk.value.posts.map((item) => (item.id === post.id ? { ...item, status: "archived" } : item)),
                        "Post archived"
                      )
                    }
                  >
                    Archive
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 rounded-full"
                  onClick={() =>
                    savePosts(
                      desk.value.posts.filter((item) => item.id !== post.id),
                      "Post deleted"
                    )
                  }
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
          <CardHeader title="As readers see it" note="Published posts on the public list">
            <Link href="/blog" className="text-sm font-semibold underline-offset-4 hover:underline">
              Open
            </Link>
          </CardHeader>
          <FilterChips
            label="Category"
            value={category}
            onChange={setCategory}
            options={["all", ...BLOG_CATEGORIES].map((value) => ({ value, label: value === "all" ? "All" : value }))}
          />
          {tagsInUse.length > 0 ? (
            <FilterChips
              label="Tag"
              value={tag}
              onChange={setTag}
              options={["all", ...tagsInUse].map((value) => ({ value, label: value === "all" ? "All" : value }))}
            />
          ) : null}
          <ul className="flex flex-col">
            {published.map((post) => (
              <li key={post.id} className="border-b border-border py-3 last:border-none">
                <Link href={`/blog/${post.slug}`} className="block">
                  <span className="text-xs text-muted-foreground">{post.category}</span>
                  <span className="mt-0.5 block text-sm font-semibold">{post.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">{post.excerpt}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
