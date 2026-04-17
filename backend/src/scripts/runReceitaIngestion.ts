import dotenv from "dotenv";
import { runSourceIngestion } from "../workers/ingestionWorker";

dotenv.config();

const SOURCE_KEY = "receita_sle_json";

async function main(): Promise<void> {
  const startedAt = new Date().toISOString();
  console.log(`[cron] start source=${SOURCE_KEY} at=${startedAt}`);

  const result = await runSourceIngestion(SOURCE_KEY);

  const finishedAt = new Date().toISOString();
  console.log(`[cron] finish source=${SOURCE_KEY} status=${result.status} at=${finishedAt}`);
  console.log(JSON.stringify(result));

  if (result.status === "failed" || result.status === "skipped") {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "unknown error";
  console.error(`[cron] failed source=${SOURCE_KEY} error=${message}`);
  process.exit(1);
});
