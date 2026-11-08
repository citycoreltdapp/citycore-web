import type { HelpArticle } from "@/constant/schemas/support";

export type { HelpArticle } from "@/constant/schemas/support";

// Sample help content. Replace with published CMS articles when available.
export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: "open-account",
    category: "Create Account",
    title: "How to Open a Bank Account",
    summary: "Learn the step-by-step process of opening an account, including the required documents.",
    body: [
      "Start with the account onboarding screen and enter your personal details.",
      "Prepare the identity and address documents requested during verification.",
      "Review your details before submitting. Account creation and verification are not connected in this preview.",
    ],
    href: "/dashboard/onboarding",
    updatedAt: "2026-10-22",
  },
  {
    id: "security",
    category: "Security",
    title: "Digital Banking Security Best Practices",
    summary:
      "Explore essential tips and practices to ensure the security of your online and mobile banking activities.",
    body: [
      "Use a unique password and keep your sign-in details private.",
      "Review the authentication methods in Settings & Security.",
      "Never share passwords, one-time codes or recovery codes with someone claiming to be support.",
    ],
    href: "/dashboard/settings/security",
    updatedAt: "2026-10-21",
  },
  {
    id: "credit-scores",
    category: "Scores",
    title: "Understanding Credit Scores",
    summary:
      "Demystify credit scores and their impact on your financial health. Learn how to interpret your credit report.",
    body: [
      "Credit reports describe borrowing and repayment records. Scoring methods vary by provider.",
      "Review reports from the relevant credit bureau and ask the provider about unfamiliar entries.",
      "Credit scoring and borrowing services are not available in this City Core preview.",
    ],
    href: null,
    updatedAt: "2026-10-20",
  },
  {
    id: "reporting-fraud",
    category: "Reporting Fraud",
    title: "What You Need to Know",
    summary:
      "Know the signs of fraudulent activity and understand the steps to report it. Learn how we prioritize your security.",
    body: [
      "Stop interacting with suspicious messages or links.",
      "Keep a record of transaction references and the messages involved, without sharing passwords or codes.",
      "Use a verified support channel supplied by your account provider. Live fraud reporting is not connected in this preview.",
    ],
    href: null,
    updatedAt: "2026-10-19",
  },
  {
    id: "contact-support",
    category: "Your Guide",
    title: "Contacting Customer Support",
    summary: "Find the various channels through which you can reach our customer support team for assistance.",
    body: [
      "Search the Help Center for the feature you need.",
      "Include a short description of the issue and a transaction reference where relevant. Do not include passwords, codes or identity documents.",
      "Live chat, phone and email support have not been connected to this preview.",
    ],
    href: null,
    updatedAt: "2026-10-18",
  },
  {
    id: "savings",
    category: "Savings Account",
    title: "Choosing the Right Savings Account",
    summary: "Explore the features and benefits of different savings accounts, and options that fit your needs.",
    body: [
      "Compare the provider’s published fees, access conditions and eligibility requirements.",
      "Read the account terms before making a decision.",
      "Savings accounts are a sample Help Center topic and are not offered in this preview.",
    ],
    href: null,
    updatedAt: "2026-10-17",
  },
  {
    id: "fees",
    category: "Fees",
    title: "Demystifying Overdraft Fees",
    summary:
      "Understand how overdraft fees work, how to avoid them, and what to do if you find yourself in an overdraft situation.",
    body: [
      "Check your provider’s fee schedule and the terms for your account.",
      "Ask the provider to explain any charge you do not recognize.",
      "Overdraft facilities and charges are not implemented in this preview.",
    ],
    href: null,
    updatedAt: "2026-10-16",
  },
  {
    id: "investment-basics",
    category: "Investment",
    title: "Investment Basics for Beginners",
    summary: "A beginner’s guide to understanding different investment options, risk factors, and potential returns.",
    body: [
      "Open the marketplace and review an offering’s unit price, term and availability.",
      "Read the prospectus, risk disclosures and investor agreement. Target returns are projections, not guarantees; capital is at risk.",
      "Use the investment calculator to explore an illustrative allocation. Purchases are not processed in this preview.",
    ],
    href: "/dashboard/marketplace",
    updatedAt: "2026-10-15",
  },
  {
    id: "card-tips",
    category: "Tips",
    title: "Credit Card Usage Tips and Tricks",
    summary: "Learn how to use your credit card while maintaining responsible usage habits.",
    body: [
      "Check the issuer’s statement dates, repayment terms and charges.",
      "Keep your card details private and review transactions regularly.",
      "Cards and credit facilities are not connected to this preview.",
    ],
    href: null,
    updatedAt: "2026-10-14",
  },
  {
    id: "home-loan",
    category: "Home Loan",
    title: "Home Loan Application Process",
    summary:
      "A detailed walkthrough of the home loan application process, including documentation and eligibility criteria.",
    body: [
      "Ask the lender for its current eligibility criteria and document checklist.",
      "Review the proposed loan terms and repayment obligations before applying.",
      "Home loans are a sample guide topic; applications cannot be submitted in this preview.",
    ],
    href: null,
    updatedAt: "2026-10-13",
  },
  {
    id: "travel-cards",
    category: "Traveling Card",
    title: "Traveling with Your Debit/Credit Card",
    summary: "Tips and precautions for using your cards while traveling to ensure a secure experience.",
    body: [
      "Check the issuer’s international usage settings, fees and support channels before travel.",
      "Use the issuer’s official app to review unfamiliar transactions.",
      "Travel and card services are not implemented in this preview.",
    ],
    href: null,
    updatedAt: "2026-10-12",
  },
  {
    id: "emergency-funds",
    category: "Emergency Funds",
    title: "The Importance of Emergency Funds",
    summary: "Understand why having an emergency fund can help with unexpected expenses.",
    body: [
      "Unexpected expenses can interrupt everyday plans.",
      "Review your circumstances and the access terms of any account you consider using.",
      "This sample article provides general information, not personalized financial advice.",
    ],
    href: null,
    updatedAt: "2026-10-11",
  },
  {
    id: "fund-wallet",
    category: "Wallet",
    title: "Funding Your City Core Wallet",
    summary: "Find the funding controls and understand how to review a wallet deposit.",
    body: [
      "Open Wallet and review the funding methods shown.",
      "Check the account details and reference before starting a transfer.",
      "Deposits and balances are illustrative in this preview; no real funds are accepted.",
    ],
    href: "/dashboard/wallet",
    updatedAt: "2026-10-10",
  },
  {
    id: "withdrawals",
    category: "Withdrawals",
    title: "Reviewing a Withdrawal Request",
    summary: "Learn where to find withdrawal details and how to check a request’s status.",
    body: [
      "Open the Withdrawals screen and review the request details.",
      "Confirm the destination and amount before using a live withdrawal service.",
      "Withdrawal requests and their status are sample data in this preview.",
    ],
    href: "/dashboard/withdrawals",
    updatedAt: "2026-10-09",
  },
  {
    id: "identity",
    category: "Verification",
    title: "Completing Identity Verification",
    summary: "Learn where to enter personal details and review verification documents.",
    body: [
      "Start the onboarding flow and complete the personal information section.",
      "Use only documents requested by the verified account provider.",
      "Identity checks and document submission are not connected in this preview.",
    ],
    href: "/dashboard/onboarding",
    updatedAt: "2026-10-08",
  },
  {
    id: "portfolio",
    category: "My Investments",
    title: "Understanding Your Investment Portfolio",
    summary: "Read invested principal, accrued yield, tenure and maturity information in your portfolio.",
    body: [
      "Open My Investments to see the portfolio summary and holdings.",
      "Switch between grid and list views to review units and maturity dates.",
      "Portfolio values and accrued yields are illustrative and do not represent a live account.",
    ],
    href: "/dashboard/investments",
    updatedAt: "2026-10-07",
  },
];
export const PAGE_SIZE = 12;
export function findHelpArticles(query: string, sort: string) {
  const term = query.trim().toLowerCase();
  return HELP_ARTICLES.filter((article) =>
    `${article.title} ${article.category} ${article.summary} ${article.body.join(" ")}`.toLowerCase().includes(term)
  ).toSorted((a, b) =>
    sort === "title"
      ? a.title.localeCompare(b.title)
      : sort === "oldest"
        ? a.updatedAt.localeCompare(b.updatedAt)
        : b.updatedAt.localeCompare(a.updatedAt)
  );
}
export const articleText = (article: HelpArticle) =>
  `City Core Help Center — sample guide\n\n${article.title}\n${article.category} · Updated ${article.updatedAt}\n\n${article.summary}\n\n${article.body.map((paragraph, index) => `${index + 1}. ${paragraph}`).join("\n\n")}\n\nThis guide is illustrative and does not confirm product availability.\n`;
