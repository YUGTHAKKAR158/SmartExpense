# SmartExpense

A full-stack expense management platform with group expense splitting, receipt scanning (OCR), spending predictions, and budget insights — available as a web app and a React Native mobile app.

## Overview

SmartExpense helps individuals and groups track spending, split shared expenses, scan receipts automatically, and understand their financial habits through visual analytics and predictions.

The project is a monorepo with three parts:

| Folder | Description |
|---|---|
| [`smart-expense-api`](smart-expense-api) | Node.js / Express REST API — auth, expenses, budgets, groups, receipts, reports |
| [`smart-expense-client`](smart-expense-client) | React + Vite web dashboard |
| [`SmartExpenseMobile`](SmartExpenseMobile) | React Native mobile app |

## Features

- **Authentication** — email/password login plus Google and GitHub OAuth (SSO)
- **Expense tracking** — create, categorize, and manage personal expenses
- **Budgets** — set spending limits and track progress
- **Groups & splitting** — shared group expenses with invites and public group views
- **Receipt scanning** — upload a receipt image and auto-extract details via OCR (Tesseract.js)
- **Reports** — export expense reports as PDF or CSV
- **Insights & predictions** — spending pattern analysis and forecasting
- **Dashboard** — category, daily, and monthly charts (Chart.js / Recharts)
- **Mobile app** — native Android/iOS client with the same core features

## Tech Stack

**Backend** — Node.js, Express, MongoDB (Mongoose), JWT auth, Passport (Google/GitHub OAuth), Multer, Tesseract.js (OCR), PDFKit, json2csv, Helmet, express-rate-limit

**Web frontend** — React 19, Vite, Tailwind CSS, React Router, Axios, Chart.js, Recharts

**Mobile** — React Native, React Navigation, react-native-chart-kit, AsyncStorage

## Project Structure

```
SmartExpense/
├── smart-expense-api/       # Express REST API
│   └── src/
│       ├── controllers/     # auth, expense, budget, group, receipt, report, insights, prediction
│       ├── models/          # User, Expense, Budget, Group, GroupExpense
│       ├── routes/
│       ├── middleware/
│       └── config/
├── smart-expense-client/    # React web dashboard
│   └── src/
│       ├── api/             # Axios API clients
│       ├── components/      # dashboard, expenses, budget, groups, reports, insights, predictions
│       ├── pages/
│       ├── context/         # Auth & Invite context
│       └── hooks/
└── SmartExpenseMobile/      # React Native app
    └── src/
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm

### 1. Backend API

```bash
cd smart-expense-api
npm install
```

Create a `.env` file in `smart-expense-api/` with the following variables:

```env
NODE_ENV=development
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d

CLIENT_URL=http://localhost:5173

GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
```

Run the API:

```bash
npm run dev     # development, with nodemon
npm start       # production
```

The server validates all required environment variables on startup and will exit with a clear error if any are missing.

### 2. Web Client

```bash
cd smart-expense-client
npm install
npm run dev
```

The app runs on `http://localhost:5173` by default and expects the API to be running on `http://localhost:5000`.

### 3. Mobile App

```bash
cd SmartExpenseMobile
npm install
npx react-native run-android   # or run-ios
```

## License

ISC
