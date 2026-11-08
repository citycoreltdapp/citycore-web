"use client";

import { useState } from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { SearchField } from "@/components/primitives/search-field";
import { SelectField } from "@/components/primitives/select-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { pageWindow } from "@/lib/page-window";
import {
  AiChat02Icon,
  ArrowDataTransferHorizontalIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CloudIcon,
  Coins01Icon,
  CreditCardIcon,
  CustomerSupportIcon,
  Download01Icon,
  Globe02Icon,
  Invoice01Icon,
  MoreHorizontalIcon,
  PiggyBankIcon,
  ShoppingCart01Icon,
  SmartPhone01Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

import { HELP_ARTICLES, type HelpArticle, PAGE_SIZE, articleText, findHelpArticles } from "./_data";

function downloadHelpText(name: string, content: string) {
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
function downloadArticle(article: HelpArticle) {
  downloadHelpText(article.id, articleText(article));
}
function openArticle(article: HelpArticle) {
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

const PRODUCTS = [
  {
    id: "wallet",
    title: "Wallet",
    description: "The best self-hosted wallet",
    icon: Wallet01Icon,
    articleId: "fund-wallet",
  },
  { id: "commerce", title: "E-Commerce", description: "Accept payment from anyone", icon: ShoppingCart01Icon },
  { id: "cloud", title: "Cloud", description: "Build the future of payments", icon: CloudIcon },
  { id: "trading", title: "Online Trading", description: "Access our trading terminal", icon: Globe02Icon },
  { id: "exchange", title: "Exchange", description: "Access to our exchange", icon: ArrowDataTransferHorizontalIcon },
  {
    id: "transactions",
    title: "Query & Transactions",
    description: "Secure payments",
    icon: Invoice01Icon,
    articleId: "withdrawals",
  },
  { id: "card", title: "Card", description: "Spend funds, earn rewards", icon: CreditCardIcon, articleId: "card-tips" },
  { id: "intelligence", title: "Intelligence", description: "Power your fintech compliance", icon: AiChat02Icon },
  { id: "apps", title: "Apps downloads", description: "Our apps for web and mobile", icon: SmartPhone01Icon },
  {
    id: "loans",
    title: "Loans and Credit",
    description: "Applying for loans or a credit card",
    icon: Coins01Icon,
    articleId: "home-loan",
  },
  {
    id: "banking",
    title: "Digital Banking",
    description: "Security tips for digital transactions",
    icon: PiggyBankIcon,
    articleId: "security",
  },
  {
    id: "support",
    title: "Customer Support",
    description: "Contacting customer support",
    icon: CustomerSupportIcon,
    articleId: "contact-support",
  },
  {
    id: "investments",
    title: "Investments",
    description: "Explore property investment offerings",
    icon: ShoppingCart01Icon,
    articleId: "investment-basics",
  },
  {
    id: "withdrawals",
    title: "Withdrawals",
    description: "Review withdrawal requests",
    icon: ArrowDataTransferHorizontalIcon,
    articleId: "withdrawals",
  },
  {
    id: "verification",
    title: "Identity Verification",
    description: "Complete your personal information",
    icon: Invoice01Icon,
    articleId: "identity",
  },
];
function productArticle(product: (typeof PRODUCTS)[number]): HelpArticle {
  if (product.id === "transactions")
    return {
      id: "transactions",
      category: "Product Info",
      title: "Query & Transactions",
      summary: "Review account activity and transaction details.",
      body: [
        "Open Transactions to search and review the activity shown.",
        "Use transaction references when checking an entry or preparing a support request.",
        "Transaction records and reports are sample data in this preview.",
      ],
      href: "/transactions",
      updatedAt: "2026-10-22",
    };
  if (product.id === "intelligence")
    return {
      id: "intelligence",
      category: "Product Info",
      title: "Intelligence",
      summary: "Explore the Invest with AI preview.",
      body: [
        "Open Ask AI and choose your budget, horizon and preferred locations.",
        "Review the sample matches and their underlying offering documents independently.",
        "The preview uses local matching rules; no live AI service is connected.",
      ],
      href: "/ask-ai",
      updatedAt: "2026-10-22",
    };
  return (
    HELP_ARTICLES.find((article) => article.id === product.articleId) ?? {
      id: product.id,
      category: "Product Info",
      title: product.title,
      summary: product.description,
      body: [
        `${product.title} is a sample product topic from the Help Center design. This service is not connected in the current City Core preview.`,
        "Check product availability and terms with City Core before using a live service.",
        "Do not share passwords, verification codes or recovery details when seeking help.",
      ],
      href: null,
      updatedAt: "2026-10-22",
    }
  );
}
function ProductGuides() {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card className="ring-0">
      <CardHeader className="flex items-center justify-between border-b border-dashed pb-4">
        <CardTitle>Product Info</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="Product guide options" />}>
            <HugeiconsIcon icon={MoreHorizontalIcon} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>
                downloadHelpText(
                  "citycore-product-guides",
                  `City Core Help Center — sample product index\n\n${PRODUCTS.map((product) => `${product.title}: ${product.description}`).join("\n")}\n\nProduct availability is illustrative in this preview.`
                )
              }
            >
              Download guide index
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setExpanded((current) => !current)}>
              {expanded ? "Show fewer topics" : "Show all topics"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(expanded ? PRODUCTS : PRODUCTS.slice(0, 12)).map((product) => (
            <div
              key={product.id}
              className="flex min-w-0 items-center gap-3 rounded-lg border border-border/50 bg-muted/70 p-4"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card text-primary">
                <HugeiconsIcon icon={product.icon} className="size-5" />
              </span>
              <button
                type="button"
                className="min-w-0 flex-1 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => openArticle(productArticle(product))}
              >
                <span className="block text-sm font-medium text-primary">{product.title}</span>
                <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">
                  {product.description}
                </span>
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 rounded-full bg-card"
                aria-label={`Download ${product.title} guide`}
                onClick={() => downloadArticle(productArticle(product))}
              >
                <HugeiconsIcon icon={Download01Icon} />
              </Button>
            </div>
          ))}
        </div>
        <div className="border-t border-dashed pt-3">
          <Button
            variant="ghost"
            className="px-0 text-xs text-primary"
            aria-expanded={expanded}
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? "See Less ↑" : "See More →"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Client$SupportPage() {
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
