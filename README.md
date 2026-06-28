# RefundAI — AI Customer Support Agent for E-commerce Refund Processing

> A production-grade SaaS application built with Next.js 15, Groq AI (Llama 3.3), and a real-time admin dashboard.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Groq AI](https://img.shields.io/badge/Groq-Llama%203.3-orange?style=flat-square)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06b6d4?style=flat-square&logo=tailwindcss)

---

## 🎯 What This Is

RefundAI is a complete AI-powered customer support agent that intelligently processes or denies e-commerce refund requests. It uses a real **function-calling agent loop** with Groq AI (Llama 3.3 70B) that dynamically invokes 8 custom tools, validates against a strict refund policy, and streams decisions in real-time.

---

## ✨ Features

### 🤖 AI Agent
- Real function-calling agent using Groq AI with 8 custom tools
- Streaming SSE responses — watch the agent think in real-time
- Deterministic policy enforcement
- 6-step reasoning chain

### 💬 Customer Chat Interface
- ChatGPT-style streaming chat UI
- 🎙️ **Voice Support** — speak your refund request (Chrome)
- 🌐 **Hindi + English** language toggle
- 6 pre-built suggested prompts
- Live tool status badges
- Decision cards with refund amounts

### 📊 Admin Dashboard
- 🔐 **Password protected login** (admin / refundai2024)
- Live stats with auto-refresh every 5s
- Recharts-powered trend visualization
- Full reasoning trace per session

### 📈 Analytics Page
- Weekly refund trends
- Top rejection reasons
- Customer tier breakdown
- Product category analysis

### 👥 CRM Dashboard
- 15 customer profiles searchable
- Per-customer eligibility analysis
- Order history, refund reason, tier badge

### 📋 Policy Center
- 7 refund policy rules
- Pass/fail examples for each rule

### 📧 Email Notifications
- Auto email on approve/reject
- Beautiful HTML email template
- Gmail SMTP integration

### 🗄️ MongoDB Ready
- Production database support
- Falls back to in-memory if not configured

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| AI | Groq AI — Llama 3.3 70B |
| Charts | Recharts |
| Icons | Lucide React |
| Voice | Web Speech API |
| Email | Nodemailer + Gmail |
| Database | MongoDB Atlas (optional) |
| Deployment | Vercel / Netlify |

---

## 📁 Project Structure

```
refund-agent/
├── app/
│   ├── page.tsx              # Landing page
│   ├── agent/page.tsx        # Customer chat + voice
│   ├── admin/page.tsx        # Admin dashboard (login protected)
│   ├── analytics/page.tsx    # Analytics & trends
│   ├── crm/page.tsx          # CRM customer browser
│   ├── policy/page.tsx       # Refund policy viewer
│   └── api/
│       ├── agent/route.ts    # SSE streaming agent
│       ├── auth/route.ts     # Admin authentication
│       ├── customers/route.ts
│       ├── sessions/route.ts
│       ├── stats/route.ts
│       └── policy/route.ts
├── components/
│   ├── chat/ChatInterface.tsx  # Voice + Hindi support
│   └── layout/Navbar.tsx
├── lib/
│   ├── agent/tools.ts        # 8 agent tools
│   ├── data/customers.ts     # 15 CRM profiles
│   ├── data/policy.ts        # 7-rule refund policy
│   ├── store/sessions.ts     # Session store
│   ├── email.ts              # Email notifications
│   └── db.ts                 # MongoDB connection
└── types/index.ts
```

---

## 🚀 Getting Started

```bash
git clone https://github.com/monu655/refund-agent
cd refund-agent
npm install
cp .env.example .env.local
# Add your keys to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## ⚙️ Environment Variables

```env
# Required
GROQ_API_KEY=gsk_...

# Admin Dashboard
ADMIN_USER=admin
ADMIN_PASS=refundai2024

# Email (Optional)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password

# Database (Optional)
MONGODB_URI=mongodb+srv://...

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🧪 Test Cases

| Order ID | Customer | Expected | Reason |
|----------|----------|----------|--------|
| `ORD-2024-8821` | Priya Sharma | ✅ APPROVED | Electronics defect + evidence |
| `ORD-2024-7743` | Arjun Mehta | ❌ REJECTED | Digital product |
| `ORD-2024-3301` | Ravi Kumar | ❌ REJECTED | Custom product |
| `ORD-2024-1187` | Deepak Verma | ❌ REJECTED | Refund limit exceeded |
| `ORD-2024-2234` | Vikram Reddy | ❌ REJECTED | Outside 30-day window |
| `ORD-2024-5509` | Sneha Patel | ✅ APPROVED | iPad defect + evidence |

---

## 🔧 Agent Tools (8)

1. `getCustomerByOrderId` — Fetch customer from CRM
2. `getRefundPolicy` — Load policy document
3. `validateRefundWindow` — Check 30-day rule
4. `validateRefundHistory` — Check 2-refund limit
5. `validateProductEligibility` — Block digital/custom
6. `calculateRefundAmount` — Full or partial refund
7. `approveRefund` — Record approval
8. `rejectRefund` — Record rejection

---

## 📜 Refund Policy (7 Rules)

| Rule | Condition |
|------|-----------|
| 30-Day Window | Within 30 days of delivery |
| Delivery Required | Must be delivered |
| Max 2 Refunds | Per 12 months |
| Digital = Non-refundable | Software, subscriptions |
| Custom = Non-refundable | Unless defective |
| Damage needs evidence | Photos/video required |
| Amount ≤ Order value | Cannot exceed original |

---

## 🎙️ Voice Support

1. Go to `/agent`
2. Click the 🎙️ mic button
3. Speak your refund request
4. AI processes automatically

Works in Chrome browser.

---

## 🔐 Admin Login

URL: `/admin`
- Username: `admin`
- Password: `refundai2024`

Change via `ADMIN_USER` and `ADMIN_PASS` env variables.

---

## 🚢 Deploy

```bash
# Vercel (Recommended)
vercel

# Add environment variables in Vercel dashboard
# GROQ_API_KEY is required
```

---

## 👨‍💻 Built By

Monu Gautam — Next.js Developer Assignment for Jobform Automator

GitHub: [github.com/monu655/refund-agent](https://github.com/monu655/refund-agent)