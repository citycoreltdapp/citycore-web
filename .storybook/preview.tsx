import type { Preview } from "@storybook/react-vite";

import "../app/globals.css";
import { Providers } from "../providers";
import "./preview.css";

// next-themes renders a <script> for server rendering. It's harmless on the client, where Storybook renders,
// but React warns about it on every story and buries real errors.
const consoleError = console.error;
console.error = (...args: unknown[]) => {
  if (typeof args[0] === "string" && args[0].includes("Encountered a script tag")) return;
  consoleError(...args);
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  globalTypes: {
    theme: {
      description: "Color theme",
      toolbar: {
        title: "Theme",
        icon: "mirror",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: "light" },
  decorators: [
    (Story, { globals }) => (
      <Providers forcedTheme={globals.theme}>
        <div className="font-sans text-foreground antialiased">
          <Story />
        </div>
      </Providers>
    ),
  ],
};

export default preview;
