import { defineConfig } from "drizzle-kit";

const directUrl = process.env.DIRECT_URL;
if (!directUrl) {
  throw new Error(
    "DIRECT_URL is required to run drizzle-kit. Copy .env.example to .env and fill the direct connection string.",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: directUrl,
  },
});
