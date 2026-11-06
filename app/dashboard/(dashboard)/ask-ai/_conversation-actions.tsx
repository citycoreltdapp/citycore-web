"use client";
import { useState } from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { TextField } from "@/components/primitives/text-field";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";

import { type Conversation, conversationText } from "./_chat-data";
import { useChat } from "./_chat-store";

// AppModal is mounted above the route provider; pass the callback into its content.
function RenameForm({ initialTitle, onSave }: { initialTitle: string; onSave: (title: string) => void }) {
  const [title, setTitle] = useState(initialTitle);
  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!title.trim()) return;
        onSave(title);
        AppModal.close();
      }}
    >
      <TextField
        id="conversation-title"
        label="Conversation name"
        value={title}
        onChange={setTitle}
        maxLength={80}
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => AppModal.close()}>
          Cancel
        </Button>
        <Button type="submit" disabled={!title.trim()}>
          Save name
        </Button>
      </div>
    </form>
  );
}
export function ConversationActions({ conversation }: { conversation: Conversation }) {
  const chat = useChat();
  const download = () => {
    const url = URL.createObjectURL(new Blob([conversationText(conversation)], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `citycore-conversation-${conversation.id}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={`Options for ${conversation.title}`} />}
      >
        <HugeiconsIcon icon={MoreHorizontalIcon} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => chat.togglePin(conversation.id)}>
          {conversation.pinned ? "Unpin conversation" : "Pin conversation"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            AppModal.open({
              title: "Rename conversation",
              content: (
                <RenameForm initialTitle={conversation.title} onSave={(title) => chat.rename(conversation.id, title)} />
              ),
            })
          }
        >
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={download}>Export conversation</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            AppModal.open({
              title: "Delete conversation?",
              description: conversation.title,
              content: (
                <p className="text-sm text-muted-foreground">
                  This removes the conversation from this browser’s history.
                </p>
              ),
              secondaryButton: { children: "Keep conversation" },
              primaryButton: {
                children: "Delete conversation",
                variant: "destructive",
                onClick: () => {
                  chat.remove(conversation.id);
                  toast.success("Conversation deleted.");
                },
              },
            })
          }
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
