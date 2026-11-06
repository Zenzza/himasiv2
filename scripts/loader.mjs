import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const projectRoot = process.cwd();

export async function resolve(specifier, context, nextResolve) {
  let target = specifier;
  if (target.startsWith("@/")) {
    target = path.join(projectRoot, target.slice(2));
  }

  if (
    target.startsWith("/") ||
    /^[a-zA-Z]:\\/.test(target) ||
    target.startsWith(".")
  ) {
    const possiblePaths = [
      target,
      target + ".ts",
      target + ".tsx",
      target + ".js",
      path.join(target, "index.ts"),
      path.join(target, "index.js"),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        return nextResolve(pathToFileURL(p).href, context);
      }
    }
  }

  return nextResolve(specifier, context);
}
