"use client";

import { useParams } from "next/navigation";

import { InvestmentEditor } from "../../_editor";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <InvestmentEditor id={id} />;
}
