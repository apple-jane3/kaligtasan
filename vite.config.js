import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createNewsApiMiddleware } from "./server/news-feed.js";

function newsApiPlugin() {
  const handler = createNewsApiMiddleware();
  return {
    name: "news-api",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig({
  plugins: [react(), newsApiPlugin()],
});
