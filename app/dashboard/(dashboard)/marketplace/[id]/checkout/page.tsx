import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { notFound } from "next/navigation";

import { INVESTMENTS } from "../../_data";
import { Client$InvestmentCheckoutPage } from "./page.client";

export function generateStaticParams() {
  return INVESTMENTS.map(({ id }) => ({ id }));
}

type Params = PageProps<"/dashboard/marketplace/[id]/checkout">["params"];

async function CheckoutContent({ params }: { params: Params }) {
  const { id } = await params;
  const investment = INVESTMENTS.find((investment) => investment.id === id);
  if (!investment) notFound();
  return <Client$InvestmentCheckoutPage investment={investment} />;
}

export default function InvestmentCheckoutPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<Skeleton className="h-150 rounded-xl" />}>
      <CheckoutContent params={params} />
    </Suspense>
  );
}
