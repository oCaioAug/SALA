import "dotenv/config";
import { spawnSync } from "node:child_process";

const directUrl = process.env.DIRECT_URL;
const subcommand = process.argv[2] === "deploy" ? "deploy" : "dev";
const forwardedArgs = subcommand === "deploy" ? process.argv.slice(3) : process.argv.slice(2);

if (!directUrl) {
  console.error(
    "❌ DIRECT_URL não está definido. Configure DIRECT_URL no web/.env para rodar migrations via conexão direta."
  );
  process.exit(1);
}

process.env.DATABASE_URL = directUrl;

const args = ["prisma", "migrate", subcommand, ...forwardedArgs];

const result = spawnSync(`npx ${args.join(" ")}`, {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

if (result.error) {
  console.error("❌ Falha ao executar Prisma CLI:", result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);

