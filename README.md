# SLATZ - Digital Commerce Platform

Self-hosted digital commerce platform with Cyber-Noir Thai design, built with React, Express, and SQLite.

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
Open http://localhost:5173

### 4. Access Admin Panel
- Go to http://localhost:5173/admin
- Enter your VITE_ADMIN_ACCESS_CODE

## 📦 Production Build
```bash
npm run build
```

Deploy dist/ folder with PM2:
```bash
pm2 start dist/index.js --name slatz-api
pm2 save
```

## 🔐 Default Admin Account
- Email: dmin@slatz.xyz
- Password: dmin

⚠️ **Change this in production!**

## 📁 Project Structure
```
slatz-clean/
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types
├── package.json
└── vite.config.ts
```

## 🛠️ Tech Stack
- React 19 + TypeScript
- Vite 7 + Tailwind CSS 4
- Express + SQLite
- JWT Auth + bcrypt

## 📝 License
MIT
