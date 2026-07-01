# ⚡ RefundAI — AI Customer Support Agent for E-commerce Refund Processing

> A production-grade SaaS application built with Next.js 15, Groq AI (Llama 3.3 70B), real-time streaming, and a jaw-dropping UI that will impress any interviewer.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Groq AI](https://img.shields.io/badge/Groq-Llama%203.3%2070B-orange?style=flat-square)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06b6d4?style=flat-square&logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## 🎯 What This Is

RefundAI is a complete AI-powered customer support agent that intelligently processes or denies e-commerce refund requests. It uses a real **function-calling agent loop** with Groq AI (Llama 3.3 70B) that dynamically invokes 8 custom tools, validates against a 7-rule strict policy, and streams decisions in real-time — with some seriously impressive UI features.

---

## 🚀 Live Demo

- **GitHub:** https://github.com/monu655/refund-agent
- **Local:** http://localhost:3000

---

## 🔥 WOW Features

### 💥 Confetti Animation
Refund approved? Full-screen confetti blast fires automatically!

### 🔊 Sound Effects
- ✅ Approve → Happy ascending chime
- ❌ Reject → Low descending tone  
- ⚡ Tool call → Subtle click sound
All generated with Web Audio API — zero dependencies!

### 🤖 AI Confidence Score
After every decision, an animated progress bar shows AI confidence (91-98%). Counts up live with a glowing bar.

### 🧠 Agent Brain Visualization
While the AI is thinking, a node graph lights up step by step:
```
Customer → Policy → Window → History → Eligibility → Amount → Decision
```
Each node turns green as the agent completes it!

### ⚡ Real-time Typing Effect
Final AI response types out letter by letter — just like ChatGPT!

### 🎙️ Voice Support
Click the mic button → speak your refund request → AI processes it automatically. Works in Chrome with Web Speech API.

### 🌐 Hindi + English
Toggle between Hindi and English interface with one click.

### 🔴 Live Activity Ticker
Landing page shows real-time (simulated) refund activity:
```
✓ Priya S. from Mumbai — headphones refund approved ₹12,500
✗ Deepak V. from Delhi — shoes refund reviewed
```
Updates every 2.8 seconds!

### 📊 Live Counter Banner
Animated counters that tick up in real-time:
- **2,847+** Refunds processed
- **₹42L+** Total refunded
- **18.3s** Average decision time
- **99.2%** Policy accuracy

---

## ✨ Full Feature List

### 🤖 AI Agent
- Real function-calling agent using Groq AI with 8 custom tools
- Streaming SSE responses
- Deterministic 7-rule policy enforcement
- Complete reasoning trace for every decision

### 💬 Customer Chat Interface
- ChatGPT-style streaming chat UI
- 💥 Confetti on approval
- 🔊 Sound effects
- 🤖 AI confidence meter
- 🧠 Agent brain visualization
- ⚡ Typing effect
- 🎙️ Voice input
- 🌐 Hindi/English toggle
- 6 suggested prompts with expected outcomes

### 📊 Admin Dashboard
- 🔐 Password protected (admin / refundai2024)
- Live stats auto-refresh every 5s
- Bar chart, line chart, pie chart
- Full reasoning trace per session — expandable

### 📈 Analytics Page
- Weekly refund trends
- Top rejection reasons with progress bars
- Customer tier breakdown
- Product category eligibility analysis

### 👥 CRM Dashboard
- 15 customer profiles
- Per-customer eligibility analysis (all 4 rules checked)
- Search + tier filter

### 📋 Policy Center
- 7 refund rules in plain English
- Pass/fail examples for each rule
- Searchable

### 📧 Email Notifications
- Auto email on approve/reject
- Beautiful HTML template
- Gmail SMTP (optional)

### 🗄️ MongoDB Ready
- Falls back to in-memory if not configured
- Session model ready

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
| Sound | Web Audio API |
| Animations | CSS + Canvas API |
| Email | Nodemailer + Gmail |
| Database | MongoDB Atlas (optional) |
| Deployment | Vercel / Netlify / Railway |

---

## 📁 Project Structure

```
refund-agent/
├── app/
│   ├── page.tsx              # Landing page (live ticker + counters)
│   ├── agent/page.tsx        # Chat + voice + confetti + sound
│   ├── admin/page.tsx        # Login protected dashboard
│   ├── analytics/page.tsx    # Analytics & charts
│   ├── crm/page.tsx          # CRM browser
│   ├── policy/page.tsx       # Policy viewer
│   └── api/
│       ├── agent/route.ts    # SSE streaming agent (Groq)
│       ├── auth/route.ts     # Admin auth
│       ├── customers/route.ts
│       ├── sessions/route.ts
│       └── stats/route.ts
├── components/
│   ├── chat/ChatInterface.tsx  # All WOW features here
│   └── layout/Navbar.tsx       # Mobile responsive
├── lib/
│   ├── agent/tools.ts        # 8 agent tools
│   ├── data/customers.ts     # 15 CRM profiles
│   ├── data/policy.ts        # 7-rule policy
│   ├── store/sessions.ts     # Session store
│   ├── email.ts              # Email service
│   └── db.ts                 # MongoDB
└── types/index.ts
```

---

## 🚀 Getting Started

```bash
git clone https://github.com/monu655/refund-agent
cd refund-agent
npm install
cp .env.example .env.local
# Add GROQ_API_KEY to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## ⚙️ Environment Variables

```env
# Required
GROQ_API_KEY=gsk_...

# Admin Dashboard Login
ADMIN_USER=admin
ADMIN_PASS=refundai2024

# Email Notifications (Optional)
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
| `ORD-2024-9102` | Kavya Nair | ✅ APPROVED | Wrong size delivered |
| `ORD-2024-4455` | Rohit Gupta | ❌ REJECTED | Not yet delivered |

---

## 🔧 Agent Tools (8)

```
1. getCustomerByOrderId      → Fetch customer from CRM
2. getRefundPolicy           → Load 7-rule policy
3. validateRefundWindow      → Check ≤30 days since delivery
4. validateRefundHistory     → Check <2 refunds in 12 months
5. validateProductEligibility→ Block digital/custom/no-evidence
6. calculateRefundAmount     → Full or partial refund
7. approveRefund             → Record approval + transaction ID
8. rejectRefund              → Record rejection + violated rule
```

---

## 📜 Refund Policy (7 Rules)

| Rule | Condition |
|------|-----------|
| 30-Day Window | Within 30 days of delivery |
| Delivery Required | Must be delivered first |
| Max 2 Refunds | Per rolling 12 months |
| Digital = Non-refundable | Software, subscriptions |
| Custom = Non-refundable | Unless defective with evidence |
| Damage needs evidence | Photos/video required |
| Amount ≤ Order value | Cannot exceed original price |

---

## 🔐 Admin Login

URL: `/admin`
```
Username: admin
Password: refundai2024
```
Change via `ADMIN_USER` and `ADMIN_PASS` env variables.

---

## 🎙️ Voice Support

1. Go to `/agent`
2. Click the 🎙️ mic button
3. Speak: *"Refund for order ORD-2024-8821, my headphones stopped working"*
4. AI processes automatically!

Requires Chrome browser.

---

## 🚢 Deploy

```bash
# Vercel (Recommended for Next.js)
vercel

# Add in dashboard:
# GROQ_API_KEY = your key
# ADMIN_USER = admin
# ADMIN_PASS = refundai2024
```

---

## 👨‍💻 Author

**Monu Gautam**
Next.js Developer Assignment — Jobform Automator / AIKing Solutions

GitHub: [github.com/monu655/refund-agent](https://github.com/monu655/refund-agent)