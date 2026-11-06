"use client";
import { useState } from "react";

import { SearchField } from "@/components/primitives/search-field";
import { SelectField } from "@/components/primitives/select-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pageWindow } from "@/lib/page-window";
import { ArrowLeft01Icon, ArrowRight01Icon, Download01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";

import { downloadArticle, openArticle } from "./_article-actions";
import { PAGE_SIZE, findHelpArticles } from "./_data";
import { ProductGuides } from "./_product-guides";

export function Client$SupportPage() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(0);
  const articles = findHelpArticles(query, sort);
  const totalPages = Math.ceil(articles.length / PAGE_SIZE);
  const pageIndex = Math.min(page, Math.max(0, totalPages - 1));
  const visible = articles.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE);
  const window = pageWindow(pageIndex, totalPages);
  const search = (value: string) => {
    setQuery(value);
    setPage(0);
  };
  const jumpToArticles = () =>
    document.getElementById("help-articles")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const changePage = (next: number) => {
    setPage(next);
    jumpToArticles();
  };
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Help Center</h1>
        <Button className="h-10 rounded-full px-5" render={<Link href="/onboarding" />} nativeButton={false}>
          Open an Account
        </Button>
      </div>
      <Card className="p-4 ring-0">
        <CardContent className="grid items-center gap-6 rounded-xl bg-muted/70 px-6 py-8 md:grid-cols-[minmax(0,1fr)_0.7fr] md:px-10 md:py-6">
          <div className="space-y-5">
            <h2 className="text-3xl leading-tight font-semibold tracking-tight text-primary lg:text-4xl">
              How Can We Help You?
            </h2>
            <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
              Welcome to our Help Center! We’re here to provide you with the assistance and information you need.
            </p>
            <SearchField
              id="help-hero-search"
              value={query}
              onChange={search}
              onSearch={jumpToArticles}
              placeholder="Search help articles..."
              groupClassName="border-0 bg-card"
              className="max-w-lg"
            />
          </div>
          <Image
            src="/assets/images/support/help-center.svg"
            alt="Support specialists helping a customer online"
            width={550}
            height={550}
            priority
            className="mx-auto h-auto w-full max-w-64"
          />
        </CardContent>
      </Card>
      <ProductGuides />
      <Card id="help-articles" className="scroll-mt-4 ring-0">
        <CardHeader className="flex flex-wrap items-center justify-between gap-4 border-b border-dashed pb-4">
          <CardTitle>Popular Help Articles</CardTitle>
          <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
            <SearchField
              id="help-article-search"
              value={query}
              onChange={search}
              placeholder="Search"
              className="min-w-40 flex-1 md:w-56"
            />
            <SelectField
              id="help-sort"
              label="Sort by"
              value={sort}
              onChange={(value) => {
                setSort(value);
                setPage(0);
              }}
              items={[
                { value: "recent", label: "Recent" },
                { value: "oldest", label: "Oldest" },
                { value: "title", label: "Title A–Z" },
              ]}
              className="w-36"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="sr-only" role="status">
            {articles.length} help articles found. Page {totalPages ? pageIndex + 1 : 0} of {totalPages}.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((article) => (
              <article
                key={article.id}
                className="flex flex-col gap-3 rounded-lg border border-border/50 bg-muted/70 p-5"
              >
                <p className="text-xs text-chart-2">{article.category}</p>
                <h3 className="text-sm font-semibold text-primary">
                  <button
                    type="button"
                    onClick={() => openArticle(article)}
                    className="rounded-sm text-left underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {article.title}
                  </button>
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{article.summary}</p>
                <Button
                  variant="ghost"
                  className="mt-auto h-auto self-start px-0 py-1 text-xs text-success hover:text-success/80"
                  aria-label={`Download ${article.title}`}
                  onClick={() => downloadArticle(article)}
                >
                  Download{" "}
                  <span className="ml-1 flex size-6 items-center justify-center rounded-full bg-card">
                    <HugeiconsIcon icon={Download01Icon} className="size-3" />
                  </span>
                </Button>
              </article>
            ))}
          </div>
          {articles.length === 0 && (
            <div className="space-y-3 rounded-lg border border-dashed p-10 text-center">
              <h3 className="font-semibold">No help articles found</h3>
              <p className="text-sm text-muted-foreground">Try a different topic or clear your search.</p>
              <Button variant="secondary" onClick={() => search("")}>
                Clear search
              </Button>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-dashed pt-4">
            <p className="text-xs text-muted-foreground">
              Showing {articles.length ? pageIndex * PAGE_SIZE + 1 : 0} to{" "}
              {Math.min((pageIndex + 1) * PAGE_SIZE, articles.length)} of {articles.length} entries
            </p>
            <nav aria-label="Help article pages" className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                className="rounded-full"
                aria-label="Previous page"
                disabled={pageIndex === 0}
                onClick={() => changePage(pageIndex - 1)}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} />
              </Button>
              {window.before !== null && (
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="rounded-full"
                  aria-label="Earlier pages"
                  onClick={() => changePage(window.before!)}
                >
                  …
                </Button>
              )}
              {window.pages.map((index) => (
                <Button
                  key={index}
                  variant={index === pageIndex ? "default" : "outline"}
                  size="icon-sm"
                  className="rounded-full"
                  aria-label={`Page ${index + 1}`}
                  aria-current={index === pageIndex ? "page" : undefined}
                  onClick={() => changePage(index)}
                >
                  {index + 1}
                </Button>
              ))}
              {window.after !== null && (
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="rounded-full"
                  aria-label="Later pages"
                  onClick={() => changePage(window.after!)}
                >
                  …
                </Button>
              )}
              <Button
                variant="outline"
                size="icon-sm"
                className="rounded-full"
                aria-label="Next page"
                disabled={pageIndex >= totalPages - 1}
                onClick={() => changePage(pageIndex + 1)}
              >
                <HugeiconsIcon icon={ArrowRight01Icon} />
              </Button>
            </nav>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Sample Help Center content • guides download as text files. Product availability and account actions remain
            illustrative.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
