import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";

import { InvestmentEditor } from "../../_editor";

type Params = Promise<{ id: string }>;
async function Content({ params }: { params: Params }) {
  const { id } = await params;
  return <InvestmentEditor id={id} />;
}
export default function Page({ params }: { params: Params }) {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
      <Content params={params} />
    </Suspense>
  );
}
