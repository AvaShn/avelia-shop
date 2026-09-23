import { spawn, type ChildProcess } from "node:child_process";
import { resolve } from "node:path";

import { localAppUrl } from "./environment";

const projectRoot = process.cwd();
const appUrl = new URL(localAppUrl());
const port = appUrl.port || (appUrl.protocol === "https:" ? "443" : "80");
const nextCli = resolve(projectRoot, "node_modules/next/dist/bin/next");
const tsxCli = resolve(projectRoot, "node_modules/tsx/dist/cli.mjs");
const pollScript = resolve(projectRoot, "scripts/telegram/poll.ts");
const children = new Set<ChildProcess>();
let shuttingDown = false;

function startNode(args: string[]) {
  const child = spawn(process.execPath, args, {
    cwd: projectRoot,
    env: process.env,
    stdio: "inherit",
  });
  children.add(child);
  child.once("exit", () => children.delete(child));
  return child;
}

function stopChildren(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) child.kill();
  setTimeout(() => process.exit(exitCode), 250).unref();
}

async function waitForNext(nextProcess: ChildProcess) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (nextProcess.exitCode !== null) {
      throw new Error("سرور Next.js پیش از آماده‌شدن متوقف شد.");
    }
    try {
      await fetch(appUrl, {
        method: "HEAD",
        signal: AbortSignal.timeout(1_000),
      });
      return;
    } catch {
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 300));
    }
  }
  throw new Error(`سرور در ${appUrl.toString()} آماده نشد.`);
}

process.once("SIGINT", () => stopChildren());
process.once("SIGTERM", () => stopChildren());

async function run() {
  console.info(`راه‌اندازی سایت و بات روی ${appUrl.toString()}`);
  const nextProcess = startNode([
    nextCli,
    "dev",
    "--turbopack",
    "--port",
    port,
  ]);
  nextProcess.once("exit", (code) => {
    if (!shuttingDown) stopChildren(code ?? 1);
  });

  await waitForNext(nextProcess);
  console.info("سایت آماده است؛ polling بات در حال اجراست.");
  const pollProcess = startNode([tsxCli, pollScript]);
  pollProcess.once("exit", (code) => {
    if (!shuttingDown) stopChildren(code ?? 1);
  });
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  stopChildren(1);
});
