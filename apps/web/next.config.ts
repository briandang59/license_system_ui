import path from "node:path";
import type { NextConfig } from "next";
const config: NextConfig = { output: "standalone", outputFileTracingRoot: path.resolve(process.cwd(), "../.."), turbopack: { root: path.resolve(process.cwd(), "../.."), rules: { "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" } } } };
export default config;
