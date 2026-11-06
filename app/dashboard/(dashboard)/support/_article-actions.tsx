"use client";
import { AppModal } from "@/components/primitives/app-modal";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";

import { type HelpArticle, articleText } from "./_data";

export function downloadHelpText(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast.success("Guide download started (.txt).");
}
export function downloadArticle(article: HelpArticle) {
  downloadHelpText(article.id, articleText(article));
}
export function openArticle(article: HelpArticle) {
  AppModal.open({
    title: article.title,
    description: `${article.category} • Sample guide`,
    content: (
      <div className="space-y-5 text-sm leading-relaxed">
        <p className="text-muted-foreground">{article.summary}</p>
        <ol className="list-outside list-decimal space-y-4 pl-5">
          {article.body.map((paragraph) => (
            <li key={paragraph}>{paragraph}</li>
          ))}
        </ol>
        <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          This guide is illustrative and does not confirm product availability.
        </p>
        {article.href && (
          <Button
            className="rounded-full px-5"
            render={<Link href={article.href} onClick={() => AppModal.close()} />}
            nativeButton={false}
          >
            Explore in City Core →
          </Button>
        )}
      </div>
    ),
    primaryButton: { children: "Download guide", onClick: () => downloadArticle(article) },
    secondaryButton: { children: "Close" },
  });
}
