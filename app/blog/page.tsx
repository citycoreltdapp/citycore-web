import { BLOG_CATEGORIES, BLOG_DESK } from "@/app/admin/(admin)/blog/_data";
import { cn } from "cn";
import Link from "next/link";

export const instant = false;

export default async function BlogIndex({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tag?: string }>;
}) {
  const { category, tag } = await searchParams;
  const posts = BLOG_DESK.posts.filter(
    (post) =>
      post.status === "published" && (!category || post.category === category) && (!tag || post.tags.includes(tag))
  );
  const tags = [...new Set(BLOG_DESK.posts.filter((post) => post.status === "published").flatMap((post) => post.tags))];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <div>
        <p className="text-sm text-muted-foreground">City Core</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Notes</h1>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/blog"
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            category ? "bg-muted" : "bg-foreground text-background"
          )}
        >
          All
        </Link>
        {BLOG_CATEGORIES.map((item) => (
          <Link
            key={item}
            href={`/blog?category=${encodeURIComponent(item)}`}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              category === item ? "bg-foreground text-background" : "bg-muted"
            )}
          >
            {item}
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((item) => (
          <Link
            key={item}
            href={`/blog?tag=${encodeURIComponent(item)}`}
            className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:underline"
          >
            {item}
          </Link>
        ))}
      </div>
      <ul className="flex flex-col gap-6">
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/blog/${post.slug}`} className="block">
              <h2 className="text-xl font-semibold tracking-tight">{post.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{post.excerpt}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
