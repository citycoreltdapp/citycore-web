import { useSyncExternalStore } from "react";

const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
};

/** Follows the app's theme toggle, for libraries that need to be told the theme instead of reading CSS. */
export const useIsDark = () =>
  useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains("dark"),
    () => false
  );
