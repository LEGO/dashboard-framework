import { serve } from "bun";
import index from "./index.html";

const getEnv = () => {
  const publicEnv: Record<string, string> = {};

  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith("BUN_PUBLIC_")) {
      publicEnv[key] = value ?? "";
    }
  }
  return Response.json(publicEnv)
}

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,
    "/api/env": getEnv,
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
