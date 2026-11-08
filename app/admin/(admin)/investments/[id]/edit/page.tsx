"use client";

import { useParams } from "next/navigation";

import { InvestmentEditor } from "../../new/page";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <InvestmentEditor id={id} />;
}
