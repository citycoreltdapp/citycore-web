import type { ChatAnswer, Conversation } from "@/constant/schemas/ai";

import { HOLDINGS } from "../investments/_data";
import { INVESTMENTS, WALLET_BALANCE, naira } from "../marketplace/_data";

export { conversationSchema, chatStoreSchema } from "@/constant/schemas/ai";

export type { ChatAnswer, Conversation } from "@/constant/schemas/ai";

// ponytail: answers are prepared locally, so the thinking steps and typing are paced by a timer.
// When a live model is connected, drive them from its tool progress and token stream instead.
export const REPLY_THINKING_MS = 1800;
export const REPLY_WORD_MS = 38;
const REPLY_SETTLE_MS = 700;
export const replyDuration = (text: string) =>
  REPLY_THINKING_MS + text.split(" ").length * REPLY_WORD_MS + REPLY_SETTLE_MS;
export const REPLY_STEPS: Record<ChatAnswer["topic"], string[]> = {
  portfolio: ["Reading sample holdings", "Adding up principal and yield"],
  comparison: ["Reading sample offerings", "Lining up price, ROI and term"],
  wallet: ["Reading sample wallet data", "Finding funding and withdrawal options"],
  security: ["Opening the security settings", "Listing practical checks"],
  market: ["Reading the sample market series", "Checking the forecast caveats"],
  help: ["Matching your question", "Finding what I can help with"],
};
export const STARTERS = [
  {
    title: "Summarise my portfolio",
    question: "Summarise my investment portfolio",
    description: "Principal, yield and your current holdings",
    topic: "portfolio",
  },
  {
    title: "Compare two offerings",
    question: "Compare Golden Estate and Silver City",
    description: "Unit prices, terms and projected returns",
    topic: "comparison",
  },
  {
    title: "Understand my wallet",
    question: "What can I do with my wallet?",
    description: "Balance, funding and transaction details",
    topic: "wallet",
  },
  {
    title: "Review account security",
    question: "How do I secure my account?",
    description: "Passwords, verification and recovery",
    topic: "security",
  },
] as const;
export function createWorkspaceAnswer(question: string, previousTopic?: ChatAnswer["topic"]): ChatAnswer {
  const text = question.toLowerCase();
  if (/market insight|market trend|lagos|abuja|price.change|outlook/.test(text))
    return {
      topic: "market",
      title: "Lagos and Abuja · market outlook",
      text: "The sample series shows an 18% indexed change for Lagos and 14% for Abuja in October 2026. These are illustrative market signals, not live prices or investment returns.",
      points: [
        "Lagos leads Abuja by 4 percentage points in the sample October observation.",
        "The November–December projections carry an uncertainty range of ±6 percentage points. Sparse neighbourhood coverage may bias estimates.",
        "Market movements do not guarantee returns for an individual property. Review the offering’s prospectus and exit terms separately.",
      ],
      links: [
        { label: "Open Market Insights", href: "/market-insights" },
        { label: "Explore offerings", href: "/marketplace" },
      ],
      source: "CityCore · illustrative market outlook",
    };
  const topic = /compare|golden|silver|offering|marketplace/.test(text)
    ? "comparison"
    : /wallet|fund|balance|deposit|withdraw/.test(text)
      ? "wallet"
      : /secur|password|2fa|verif|recovery/.test(text)
        ? "security"
        : /portfolio|holding|yield|invest/.test(text)
          ? "portfolio"
          : /^(why|how about|what about|tell me more|explain|and )/.test(text) && previousTopic
            ? previousTopic
            : "help";
  if (topic === "portfolio") {
    const principal = HOLDINGS.reduce((sum, h) => sum + h.principal, 0),
      yieldValue = HOLDINGS.reduce((sum, h) => sum + h.accruedYield, 0);
    return {
      topic,
      title: "Your portfolio, at a glance",
      text: `Your sample portfolio contains ${HOLDINGS.length} active holdings with ${naira(principal)} invested principal and ${naira(yieldValue)} accrued yield.`,
      points: HOLDINGS.map(
        (h) =>
          `${INVESTMENTS.find((i) => i.id === h.investmentId)!.name}: ${h.units} units · ${naira(h.principal)} principal · ${naira(h.accruedYield)} accrued yield.`
      ).concat(
        `Combined sample value: ${naira(principal + yieldValue)}. These are illustrative records, not live account balances.`
      ),
      links: [
        { label: "Open my investments", href: "/investments" },
        { label: "Explore offerings", href: "/marketplace" },
      ],
      source: "CityCore · sample portfolio records",
    };
  }
  if (topic === "comparison")
    return {
      topic,
      title: "Golden Estate and Silver City",
      text: "Both sample offerings have a 12-month term. The entry price and target annual return differ.",
      points: INVESTMENTS.slice(0, 2)
        .map(
          (i) =>
            `${i.name}: ${naira(i.unitPrice)} per unit · ${i.annualRoi}% target simple annual ROI · ${i.tenure}-month term.`
        )
        .concat(
          "Target returns are projections, not guarantees. Review the prospectus, allocation terms and risk disclosures; capital is at risk."
        ),
      links: [
        { label: "Compare in marketplace", href: "/marketplace" },
        { label: "Investment Explorer", href: "/ask-ai/explore" },
      ],
      source: "CityCore · illustrative marketplace offerings",
    };
  if (topic === "wallet")
    return {
      topic,
      title: "Your wallet and next steps",
      text: `The wallet preview shows ${naira(WALLET_BALANCE)} available. Funding and withdrawal controls are available to explore.`,
      points: [
        "Open Wallet to review the available funding methods and recent payments.",
        "Review withdrawal details before proceeding with a live service.",
        "Balances and transactions are sample data. This preview cannot move money or complete a purchase.",
      ],
      links: [{ label: "Open wallet", href: "/wallet" }],
      source: "CityCore · sample wallet data",
    };
  if (topic === "security")
    return {
      topic,
      title: "A few practical security checks",
      text: "Start in Settings & Security to review password requirements and the two-step verification setup.",
      points: [
        "Use a unique password and keep passwords, one-time codes and recovery details private.",
        "Choose an authenticator app, email or phone in the setup preview.",
        "Two-factor authentication remains inactive until real verification services are connected.",
      ],
      links: [{ label: "Review security", href: "/settings/security" }],
      source: "CityCore · security settings preview",
    };
  return {
    topic: "help",
    title: "Let’s narrow that down",
    text: "I can help you explore the portfolio, compare Golden Estate and Silver City, explain the wallet or find security settings.",
    points: [
      "This is a workspace preview with prepared responses based on sample account data. A live AI service has not been connected.",
      "Try one of the suggested questions, or use the Help Center for product guides.",
    ],
    links: [{ label: "Browse Help Center", href: "/support" }],
    source: "CityCore · workspace guide",
  };
}
export function conversationText(conversation: Conversation) {
  return `${conversation.title}\nCityCore Ask AI · preview conversation\n\n${conversation.messages.map((message) => `${message.role === "user" ? "You" : "CityCore"}\n${message.answer ? [message.answer.title, message.answer.text, ...message.answer.points, message.answer.source].join("\n\n") : message.text}`).join("\n\n---\n\n")}\n`;
}
