"use client";
import { type ReactNode, createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { renameConversationFormSchema, sendChatMessageRequestSchema } from "@/constant/schemas/ai";
import { toast } from "sonner";

import { type Conversation, chatStoreSchema, createWorkspaceAnswer, replyDuration } from "./_chat-data";

const STORAGE_KEY = "citycore.ask-ai.v1";
const CHANGE_EVENT = "citycore-ai-history-change";
let memory = "";
let storageUnavailable = false;
const EMPTY = { activeId: null, conversations: [] } as { activeId: string | null; conversations: Conversation[] };
function readRaw() {
  if (storageUnavailable) return memory;
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return memory;
  }
}
function parse(raw: string) {
  try {
    const result = chatStoreSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : EMPTY;
  } catch {
    return EMPTY;
  }
}
function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
function write(data: typeof EMPTY) {
  memory = JSON.stringify(data);
  try {
    window.localStorage.setItem(STORAGE_KEY, memory);
    storageUnavailable = false;
  } catch {
    storageUnavailable = true;
    toast.error("Browser storage is unavailable. This conversation may not survive a refresh.");
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
function useChatState() {
  // Lives here, not in the message, so closing the panel or changing page can't leave the composer stuck on busy.
  const [replying, setReplying] = useState<{ id: string; startedAt: number; duration: number } | null>(null);
  useEffect(() => {
    if (!replying) return;
    const timer = setTimeout(() => setReplying(null), replying.duration);
    return () => clearTimeout(timer);
  }, [replying]);
  const raw = useSyncExternalStore(subscribe, readRaw, () => "");
  const state = useMemo(() => parse(raw), [raw]);
  const update = (transform: (current: typeof EMPTY) => typeof EMPTY) => write(transform(parse(readRaw())));
  const active = state.conversations.find((c) => c.id === state.activeId) ?? null;
  return {
    ...state,
    active,
    replying,
    newChat: () => update((current) => ({ ...current, activeId: null })),
    openChat: (id: string) => update((current) => ({ ...current, activeId: id })),
    rename: (id: string, title: string) => {
      const parsed = renameConversationFormSchema.safeParse({ title });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        return;
      }
      update((current) => ({
        ...current,
        conversations: current.conversations.map((c) => (c.id === id ? { ...c, title: parsed.data.title } : c)),
      }));
    },
    togglePin: (id: string) =>
      update((current) => ({
        ...current,
        conversations: current.conversations.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)),
      })),
    remove: (id: string) =>
      update((current) => ({
        activeId: current.activeId === id ? null : current.activeId,
        conversations: current.conversations.filter((c) => c.id !== id),
      })),
    feedback: (conversationId: string, messageId: string, value: "helpful" | "unhelpful", reason?: string) =>
      update((current) => ({
        ...current,
        conversations: current.conversations.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === messageId
                    ? { ...m, feedback: !reason && m.feedback === value ? undefined : value, feedbackReason: reason }
                    : m
                ),
              }
            : c
        ),
      })),
    send: (text: string) => {
      const parsed = sendChatMessageRequestSchema.safeParse({ text });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        return;
      }
      const question = parsed.data.text;
      const replyId = crypto.randomUUID();
      let duration = 0;
      update((current) => {
        const existing = current.conversations.find((c) => c.id === current.activeId);
        const previous = existing?.messages.filter((m) => m.answer).at(-1)?.answer?.topic;
        const answer = createWorkspaceAnswer(question, previous);
        duration = replyDuration(answer.text);
        const now = new Date().toISOString();
        const conversation: Conversation = existing ?? {
          id: crypto.randomUUID(),
          title: question.slice(0, 80),
          createdAt: now,
          updatedAt: now,
          pinned: false,
          messages: [],
        };
        const next = {
          ...conversation,
          updatedAt: now,
          messages: [
            ...conversation.messages,
            { id: crypto.randomUUID(), role: "user" as const, text: question },
            { id: replyId, role: "assistant" as const, text: answer.text, answer },
          ],
        };
        return { activeId: next.id, conversations: [next, ...current.conversations.filter((c) => c.id !== next.id)] };
      });
      const prefersStill = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setReplying(prefersStill ? null : { id: replyId, startedAt: Date.now(), duration });
    },
  };
}
const ChatContext = createContext<ReturnType<typeof useChatState> | null>(null);
export function ChatProvider({ children }: { children: ReactNode }) {
  const chat = useChatState();
  return <ChatContext value={chat}>{children}</ChatContext>;
}
export function useChat() {
  const chat = useContext(ChatContext);
  if (!chat) throw new Error("ChatProvider is required");
  return chat;
}
