import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { notFound } from "next/navigation";

import { INVESTMENTS } from "../_data";
import { Client$InvestmentPage } from "./page.client";

export function generateStaticParams() {
  return INVESTMENTS.map(({ id }) => ({ id }));
}

type Params = PageProps<"/dashboard/marketplace/[id]">["params"];

async function InvestmentContent({ params }: { params: Params }) {
  const { id } = await params;
  const investment = INVESTMENTS.find((investment) => investment.id === id);
  if (!investment) notFound();
  return <Client$InvestmentPage investment={investment} />;
}

export default function InvestmentPage({ params }: { params: Params }) {
  return (
    <Suspense
      fallback={
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Skeleton className="aspect-16/10 rounded-2xl" />
          <Skeleton className="h-150 rounded-2xl" />
        </div>
      }
    >
      <InvestmentContent params={params} />
    </Suspense>
  );
}
