import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVER_IP = "157.85.103.238";
const REMOTE_USER = "root";
const REMOTE_STATIC_DIR = "/var/www/synx";
const REMOTE_SERVER_DIR = "/var/www/synx-server";

console.log("🚀 Starting deployment process to VPS...");

try {
  // 1. Build the project locally
  console.log("📦 1. Building the project locally (Client & Server)...");
  execSync("npm run build", { stdio: "inherit", cwd: __dirname });
  console.log("✅ Build successful!");

  // 2. Uploading static frontend files
  console.log(`📤 2. Uploading static files (Vite build) to Nginx directory on VPS...`);
  // Ensure the remote directory exists
  execSync(`ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${SERVER_IP} "mkdir -p ${REMOTE_STATIC_DIR}"`, { stdio: "inherit" });
  
  // Pack files using tar locally
  console.log("📦 Creating temporary tarball for static files...");
  execSync(`tar -czf public.tar.gz -C dist/public .`, { stdio: "inherit", cwd: __dirname });
  
  // SCP the tarball
  console.log("📤 Sending tarball to VPS...");
  execSync(`scp -o StrictHostKeyChecking=no public.tar.gz ${REMOTE_USER}@${SERVER_IP}:${REMOTE_STATIC_DIR}/`, { stdio: "inherit", cwd: __dirname });
  
  // Extract tarball remotely and clean up
  console.log("📦 Extracting tarball on VPS...");
  execSync(`ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${SERVER_IP} "cd ${REMOTE_STATIC_DIR} && tar -xzf public.tar.gz && rm public.tar.gz"`, { stdio: "inherit" });
  
  // Clean up local tarball
  try {
    fs.unlinkSync(path.join(__dirname, "public.tar.gz"));
  } catch (err) {
    // ignore
  }
  
  console.log("✅ Frontend uploaded successfully!");

  // 3. Uploading backend server files
  console.log(`📤 3. Uploading compiled server bundle and configs to server directory on VPS...`);
  execSync(`ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${SERVER_IP} "mkdir -p ${REMOTE_SERVER_DIR}/data"`, { stdio: "inherit" });
  execSync(`scp -o StrictHostKeyChecking=no dist/index.js ${REMOTE_USER}@${SERVER_IP}:${REMOTE_SERVER_DIR}/index.js`, { stdio: "inherit", cwd: __dirname });
  execSync(`scp -o StrictHostKeyChecking=no server/ecosystem.config.cjs ${REMOTE_USER}@${SERVER_IP}:${REMOTE_SERVER_DIR}/ecosystem.config.cjs`, { stdio: "inherit", cwd: __dirname });
  execSync(`scp -o StrictHostKeyChecking=no server/package.deploy.json ${REMOTE_USER}@${SERVER_IP}:${REMOTE_SERVER_DIR}/package.json`, { stdio: "inherit", cwd: __dirname });
  console.log("✅ Backend bundle uploaded successfully!");

  // 4. Running remote post-deploy script via SSH
  console.log(`🔄 4. Reloading backend server on VPS using PM2...`);
  const remoteCommand = `
    cd ${REMOTE_SERVER_DIR} && \
    npm install --production --no-audit --no-fund && \
    (pm2 delete synx-api || true) && \
    pm2 start ecosystem.config.cjs && \
    pm2 save
  `;
  execSync(`ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${SERVER_IP} "${remoteCommand.trim()}"`, { stdio: "inherit" });
  console.log("✅ PM2 server reloaded successfully!");

  console.log("\n🎉 Deployment completed successfully! Your website is live at https://slatz.xyz/");
} catch (error) {
  console.error("❌ Deployment failed:", error.message);
  process.exit(1);
}
