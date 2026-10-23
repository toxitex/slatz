// Imported first by index.ts: auth.ts reads secrets at module load, so env files must be applied before it.
// Existing process variables (pm2 ecosystem, shell) win; .env.local wins over .env.
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // file is optional
  }
}
