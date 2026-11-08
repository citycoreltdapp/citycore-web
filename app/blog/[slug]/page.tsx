import { BLOG_DESK } from "@/app/admin/(admin)/blog/_data";
import Link from "next/link";
import { notFound } from "next/navigation";

export const instant = false;

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = BLOG_DESK.posts.find((item) => item.slug === slug && item.status === "published");
  if (!post) notFound();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-16">
      <Link href="/blog" className="text-sm font-semibold text-muted-foreground underline-offset-4 hover:underline">
        All notes
      </Link>
      <p className="text-sm text-muted-foreground">{post.category}</p>
      <h1 className="text-3xl font-semibold tracking-tight">{post.title}</h1>
      {post.body.trim().startsWith("<") ? (
        <div
          className="text-sm leading-7 [&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: post.body }}
        />
      ) : (
        post.body.split("\n\n").map((paragraph) => (
          <p key={paragraph.slice(0, 24)} className="text-sm leading-7">
            {paragraph}
          </p>
        ))
      )}
      <div className="flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <Link
            key={tag}
            href={`/blog?tag=${encodeURIComponent(tag)}`}
            className="rounded-full bg-muted px-3 py-1 text-xs font-semibold"
          >
            {tag}
          </Link>
        ))}
      </div>
    </main>
  );
}
