import type { BlogDesk } from "@/constant/schemas/admin-blog";

export const BLOG_CATEGORIES = ["Market", "Investing", "Company"] as const;

export const BLOG_DESK: BlogDesk = {
  role: "editor",
  posts: [
    {
      id: "CC-B01",
      title: "What the Lagos sample series is, and is not",
      slug: "lagos-sample-series",
      excerpt: "The October figures are illustrative signals. They are not a forecast of your return.",
      body: "City Core’s market notes use a sample series. An 18% indexed change is not a promise that a property, or your holding, will move by that amount.\n\nRead the prospectus for any offering before you invest. Capital is at risk.",
      category: "Market",
      tags: ["Lagos", "Risk"],
      status: "published",
      updatedAt: "2026-10-22T09:00:00+01:00",
    },
    {
      id: "CC-B02",
      title: "How a return is paid on a holding",
      slug: "how-a-return-is-paid",
      excerpt: "A payout is the net amount after the sample tax. It shows in your wallet as one transaction.",
      body: "When a holding pays, the investor sees one payout for the net amount. The operator still records gross, tax and net separately.\n\nNothing here is tax advice.",
      category: "Investing",
      tags: ["Returns", "Wallet"],
      status: "published",
      updatedAt: "2026-11-02T12:30:00+01:00",
    },
    {
      id: "CC-B03",
      title: "A note on leap-year birthdays",
      slug: "leap-year-birthdays",
      excerpt: "People born on 29 February are greeted on 28 February in other years.",
      body: "The birthday email is sent once each year. In a year that is not a leap year, 29 February is observed on the 28th.",
      category: "Company",
      tags: ["Email"],
      status: "draft",
      updatedAt: "2026-11-06T15:10:00+01:00",
    },
    {
      id: "CC-B04",
      title: "October referral terms, now closed",
      slug: "october-referral-terms",
      excerpt: "The October referral window has ended. This note stays available as a record.",
      body: "The October referral reward was a preview incentive. It is no longer open to new qualifications.",
      category: "Company",
      tags: ["Referrals"],
      status: "archived",
      updatedAt: "2026-11-01T08:00:00+01:00",
    },
  ],
};
