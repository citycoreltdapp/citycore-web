"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { adminContentStateSchema } from "@/constant/schemas/admin-content";

import { Notice, PageTitle } from "../_operations/ui";
import { usePreviewState } from "../_operations/use-preview-state";
import { CONTENT_DEFAULTS } from "../_operations/workspace-data";
import { AiContentWorkspace } from "./_ai-workspace";
import { LegalWorkspace } from "./_legal-workspace";

export function ContentPage() {
  const store = usePreviewState("citycore-admin-content-v1", adminContentStateSchema, CONTENT_DEFAULTS);
  return (
    <>
      <PageTitle
        title="Legal & AI Content Management"
        description="Version-controlled legal drafts and separately governed market / AI content."
      />
      {!store.ready ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-2">
          <LegalWorkspace value={store.value} save={store.save} />
          <AiContentWorkspace value={store.value} save={store.save} />
        </div>
      )}
      <Notice>
        Drafts do not change published documents, signed agreements or recommendation behavior. Live publishing requires
        authorized independent approval.
      </Notice>
    </>
  );
}
