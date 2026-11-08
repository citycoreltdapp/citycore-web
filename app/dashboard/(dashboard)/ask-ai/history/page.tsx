"use client";

import { useState } from "react";

import { SearchField } from "@/components/primitives/search-field";
import { SelectField } from "@/components/primitives/select-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Add01Icon, AiChat02Icon, ArrowRight01Icon, Clock01Icon, PinIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useChat } from "../_chat-store";
import { ConversationActions } from "../_conversation-actions";

export default function Client$AIHistoryPage() {
  const chat = useChat();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [sort, setSort] = useState("recent");
  const rows = chat.conversations
    .filter(
      (conversation) =>
        (!pinnedOnly || conversation.pinned) &&
        `${conversation.title} ${conversation.messages.map((m) => `${m.text} ${m.answer?.points.join(" ") ?? ""}`).join(" ")}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())
    )
    .toSorted((a, b) =>
      sort === "title"
        ? a.title.localeCompare(b.title)
        : sort === "oldest"
          ? a.updatedAt.localeCompare(b.updatedAt)
          : b.updatedAt.localeCompare(a.updatedAt)
    );
  const newChat = () => {
    chat.newChat();
    router.push("/ask-ai");
  };
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">ASK AI / YOUR WORKSPACE</p>
          <h1 className="text-2xl font-semibold tracking-tight">Conversation history</h1>
          <p className="mt-2 text-sm text-muted-foreground">Pick up where you left off.</p>
        </div>
        <Button className="h-10 rounded-full px-5" onClick={newChat}>
          <HugeiconsIcon icon={Add01Icon} />
          New conversation
        </Button>
      </div>
      <Card className="gap-0 overflow-hidden border py-0 ring-0">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-primary">
              <HugeiconsIcon icon={Clock01Icon} className="size-5" />
            </span>
            <div>
              <h2 className="text-sm font-medium">
                Your conversations <span className="ml-1 text-muted-foreground">{chat.conversations.length}</span>
              </h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Stored on this device</p>
            </div>
          </div>
          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
            <SearchField
              id="conversation-search"
              value={query}
              onChange={setQuery}
              placeholder="Search conversations..."
              className="min-w-48 flex-1 sm:w-64"
            />
            <Button
              variant={pinnedOnly ? "secondary" : "outline"}
              className="rounded-full"
              aria-pressed={pinnedOnly}
              onClick={() => setPinnedOnly((current) => !current)}
            >
              <HugeiconsIcon icon={PinIcon} />
              Pinned
            </Button>
            <SelectField
              id="conversation-sort"
              label="Sort conversations"
              labelClassName="sr-only"
              value={sort}
              onChange={setSort}
              items={[
                { value: "recent", label: "Most recent" },
                { value: "oldest", label: "Oldest first" },
                { value: "title", label: "Title A–Z" },
              ]}
              className="w-36"
            />
          </div>
        </div>
        <p className="sr-only" role="status">
          {rows.length} conversations found
        </p>
        {rows.length ? (
          <div className="divide-y">
            {rows.map((conversation) => {
              const last = conversation.messages.filter((m) => m.role === "user").at(-1);
              return (
                <div
                  key={conversation.id}
                  className="group flex items-center gap-4 px-5 py-5 transition-colors hover:bg-muted/35"
                >
                  <span className="hidden size-10 shrink-0 items-center justify-center rounded-xl border bg-card text-primary sm:flex">
                    <HugeiconsIcon icon={AiChat02Icon} className="size-5" />
                  </span>
                  <Link
                    href="/ask-ai"
                    onClick={() => chat.openChat(conversation.id)}
                    className="min-w-0 flex-1 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-medium">{conversation.title}</h3>
                      {conversation.pinned && (
                        <HugeiconsIcon icon={PinIcon} className="size-3.5 shrink-0 text-primary" />
                      )}
                    </div>
                    <p className="mt-1.5 truncate text-xs text-muted-foreground">{last?.text}</p>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                      <time dateTime={conversation.updatedAt}>
                        {new Date(conversation.updatedAt).toLocaleDateString("en-GB", {
                          timeZone: "Africa/Lagos",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </time>
                      <span>{conversation.messages.filter((m) => m.role === "user").length} questions</span>
                      <span>Workspace preview</span>
                    </div>
                  </Link>
                  <span className="hidden text-muted-foreground sm:block">
                    <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                  </span>
                  <ConversationActions conversation={conversation} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mx-auto flex min-h-96 max-w-md flex-col items-center justify-center px-6 py-12 text-center">
            <span className="mb-5 flex size-14 items-center justify-center rounded-2xl border bg-muted/40 text-primary">
              <HugeiconsIcon icon={query || pinnedOnly ? PinIcon : AiChat02Icon} className="size-6" />
            </span>
            <h2 className="text-xl font-semibold tracking-tight">
              {query || pinnedOnly ? "No conversations match" : "No conversations yet"}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {query || pinnedOnly
                ? "Try another search or show all conversations."
                : "Start a chat to save it here. You can reopen, pin or export it later."}
            </p>
            <Button
              variant="outline"
              className="mt-6 rounded-full px-5"
              onClick={
                query || pinnedOnly
                  ? () => {
                      setQuery("");
                      setPinnedOnly(false);
                    }
                  : newChat
              }
            >
              {query || pinnedOnly ? "Clear filters" : "Start a conversation"}
              <HugeiconsIcon icon={ArrowRight01Icon} />
            </Button>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-5 py-4">
          <p className="text-[11px] text-muted-foreground">
            History is local to this browser. Clearing site data removes it.
          </p>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs"
            render={<Link href="/ask-ai/explore" />}
            nativeButton={false}
          >
            Open Investment Explorer →
          </Button>
        </div>
      </Card>
    </>
  );
}
