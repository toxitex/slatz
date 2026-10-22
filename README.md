# SLATZ - Digital Commerce Platform

Self-hosted digital commerce platform with an Apple-inspired storefront, built with SvelteKit, Express, and SQLite.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Environment File
Create .env.local in root directory:
```env
SYNCX_JWT_SECRET=your-super-secret-jwt-key-here
VITE_ADMIN_ACCESS_CODE=your-admin-password
PORT=3000
NODE_ENV=development
```

### 3. Run Development Server
```bash
npm run dev
```
This starts the SvelteKit dev server on http://localhost:3000 and the Express API on port 5000 (`/api` and `/uploads` are proxied). Use `npm run dev:web` or `npm run dev:server` to run either side alone.

### 4. Access Admin Panel
- Go to http://localhost:3000/admin
- Enter your VITE_ADMIN_ACCESS_CODE

## 📦 Production Build
```bash
npm run build
```

The storefront is a static SPA written to `dist/public` (with an `index.html` fallback) and the API is bundled to `dist/index.js`. Deploy with `npm run deploy`, or run the API with PM2:
```bash
pm2 start dist/index.js --name slatz-api
pm2 save
```

## ✅ Checks
```bash
npm run check
```

## 🔐 Default Admin Account
- Email: admin@slatz.xyz
- Password: admin

⚠️ **Change this in production!**

## 📁 Project Structure
```
slatz/
├── src/
│   ├── routes/              # SvelteKit pages: (site) storefront + account, admin
│   └── lib/
│       ├── stores/          # Rune-based stores (auth, site config, products, ...)
│       └── components/      # Storefront, admin and shadcn-svelte UI components
├── static/                  # Fonts and favicons
├── server/                  # Express backend
├── shared/                  # Shared constants
├── svelte.config.js
└── vite.config.ts
```

## 🛠️ Tech Stack
- SvelteKit 2 + Svelte 5 (runes) + TypeScript
- shadcn-svelte / Bits UI + Tailwind CSS 4
- Express + SQLite
- JWT Auth + bcrypt

## 📝 License
MIT
