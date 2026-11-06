import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

const config: StorybookConfig = {
  stories: ["../components/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  staticDirs: ["../public"],
  viteFinal: (viteConfig) => ({
    ...viteConfig,
    plugins: [...(viteConfig.plugins ?? []), tailwindcss()],
    // Next's build output isn't part of Storybook, and watching it reloads stories on every Next build.
    server: {
      ...viteConfig.server,
      watch: { ...viteConfig.server?.watch, ignored: ["**/.next/**", "**/storybook-static/**"] },
    },
    resolve: {
      ...viteConfig.resolve,
      alias: {
        ...viteConfig.resolve?.alias,
        "@": path.resolve(process.cwd()),
      },
    },
  }),
};

export default config;
