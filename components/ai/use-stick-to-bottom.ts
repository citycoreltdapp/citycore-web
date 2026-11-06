"use client";

import * as React from "react";

const NEAR_BOTTOM_PX = 80;

/** Keeps a chat pinned to its newest line as replies grow, until the reader scrolls up to read something older. */
export function useStickToBottom(conversationKey: string | undefined) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const followingRef = React.useRef(true);
  const [atBottom, setAtBottom] = React.useState(true);

  const setFollowing = (value: boolean) => {
    followingRef.current = value;
    setAtBottom(value);
  };

  React.useEffect(() => {
    const scroller = scrollRef.current;
    const content = contentRef.current;
    if (!scroller || !content) return;
    const observer = new ResizeObserver(() => {
      if (followingRef.current) scroller.scrollTop = scroller.scrollHeight;
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    followingRef.current = true;
    const scroller = scrollRef.current;
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  }, [conversationKey]);

  return {
    scrollRef,
    contentRef,
    atBottom,
    follow: () => setFollowing(true),
    onScroll: () => {
      const scroller = scrollRef.current;
      if (scroller) setFollowing(scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < NEAR_BOTTOM_PX);
    },
    scrollToLatest: () => {
      setFollowing(true);
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    },
  };
}
