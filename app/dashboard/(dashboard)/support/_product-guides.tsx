"use client";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AiChat02Icon,
  ArrowDataTransferHorizontalIcon,
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

import { downloadArticle, downloadHelpText, openArticle } from "./_article-actions";
import { HELP_ARTICLES, type HelpArticle } from "./_data";

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
export function ProductGuides() {
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
