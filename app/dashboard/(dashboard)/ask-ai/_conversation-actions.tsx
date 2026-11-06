"use client";
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
import { renameConversationFormSchema } from "@/constant/schemas/ai";
import { zodResolver } from "@hookform/resolvers/zod";
import { MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { type Conversation, conversationText } from "./_chat-data";
import { useChat } from "./_chat-store";

// AppModal is mounted above the route provider; pass the callback into its content.
function RenameForm({ initialTitle, onSave }: { initialTitle: string; onSave: (title: string) => void }) {
  const form = useForm({
    resolver: zodResolver(renameConversationFormSchema),
    defaultValues: { title: initialTitle },
    mode: "onTouched",
  });
  return (
    <form
      className="space-y-5"
      onSubmit={form.handleSubmit(({ title }) => {
        onSave(title);
        AppModal.close();
      })}
    >
      <Controller
        control={form.control}
        name="title"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            id="conversation-title"
            label="Conversation name"
            maxLength={80}
            autoFocus
            error={fieldState.error?.message}
          />
        )}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => AppModal.close()}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
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
