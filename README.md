# RefundAI — AI Customer Support Agent for E-commerce Refund Processing

> A production-grade SaaS application built with Next.js 15, OpenAI function calling, and a real-time admin dashboard. Designed for a Next.js Developer hiring assignment — built to impress.

![RefundAI](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-green?style=flat-square&logo=openai)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06b6d4?style=flat-square&logo=tailwindcss)

---

## 🎯 What This Is

RefundAI is a complete AI-powered customer support agent that intelligently processes or denies e-commerce refund requests. It uses a real **function-calling agent loop** with GPT-4o that dynamically invokes 8 custom tools, validates against a strict refund policy, and streams decisions in real-time.

---

## ✨ Features

### 🤖 AI Agent
- **Real function-calling agent** using OpenAI GPT-4o with 8 custom tools
- **Streaming SSE responses** — watch the agent think in real-time
- **Deterministic policy enforcement** — never approves what shouldn't be approved
- **6-step reasoning chain**: Request → Tool Calls → Policy Validation → Decision → Response

### 💬 Customer Chat Interface
- ChatGPT-style streaming chat UI
- 6 pre-built suggested prompts (valid refund, edge cases, violations)
- Live tool status badges (running / success / error)
- Agent "thinking" state with animated indicators
- Decision cards with refund amounts

### 📊 Admin Dashboard
- Live stats: total requests, approved/rejected, approval rate, avg resolution time
- Recharts-powered refund trend visualization
- Real-time activity log from all agent sessions
- Full reasoning trace per session (all 6 steps)

### 👥 CRM Dashboard
- All 15 customer profiles searchable
- Per-customer eligibility analysis (auto-checks all 4 policy rules)
- Order history, refund reason, tier badge

### 📋 Policy Center
- All 7 refund policy rules with pass/fail examples
- Visual rule cards with conditions

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + CSS custom properties |
| AI | OpenAI GPT-4o, function calling |
| Charts | Recharts |
| Icons | Lucide React |
| Animation | CSS animations + transitions |
| State | React useState/useEffect (no over-engineering) |
| Data | In-memory store (MongoDB-ready) |
| Deployment | Vercel-ready |

---

## 📁 Project Structure

```
refund-agent/
├── app/
│   ├── page.tsx              # Landing page (hero, features, CTA)
│   ├── agent/page.tsx        # Customer chat interface
│   ├── admin/page.tsx        # Admin dashboard + reasoning logs
│   ├── crm/page.tsx          # CRM customer browser
│   ├── policy/page.tsx       # Refund policy viewer
│   └── api/
│       ├── agent/route.ts    # SSE streaming agent endpoint
│       ├── customers/route.ts
│       ├── sessions/route.ts
│       ├── stats/route.ts
│       └── policy/route.ts
├── components/
│   ├── chat/ChatInterface.tsx
│   └── layout/Navbar.tsx
├── lib/
│   ├── agent/tools.ts        # 8 agent tools + OpenAI tool definitions
│   ├── data/customers.ts     # 15 CRM customer profiles
│   ├── data/policy.ts        # 7-rule refund policy
│   └── store/sessions.ts     # In-memory session store
└── types/index.ts            # Full TypeScript types
```

---

## 🚀 Getting Started

### 1. Clone and install

```bash
git clone https://github.com/yourusername/refund-agent
cd refund-agent
npm install
```

### 2. Set up environment

```bash
cp .env.example .env.local
# Add your OpenAI API key to .env.local
```

```env
OPENAI_API_KEY=sk-your-key-here
```

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🧪 Test Cases — Demo Script

Use these order IDs in the chat to demonstrate all scenarios:

| Order ID | Customer | Expected Decision | Reason |
|----------|----------|-------------------|--------|
| `ORD-2024-8821` | Priya Sharma | ✅ **APPROVED** | Electronics defect, within 30 days, evidence provided |
| `ORD-2024-7743` | Arjun Mehta | ❌ **REJECTED** | Digital product (Adobe CC) — non-refundable |
| `ORD-2024-3301` | Ravi Kumar | ❌ **REJECTED** | Custom product, change of mind |
| `ORD-2024-1187` | Deepak Verma | ❌ **REJECTED** | 2 previous refunds already (limit exceeded) |
| `ORD-2024-2234` | Vikram Reddy | ❌ **REJECTED** | Outside 30-day window (118 days) |
| `ORD-2024-5509` | Sneha Patel | ✅ **APPROVED** | iPad dead pixels, platinum tier, evidence provided |
| `ORD-2024-9102` | Kavya Nair | ✅ **APPROVED** | Wrong size delivered, within window |
| `ORD-2024-8812` | Divya Menon | ❌ **REJECTED** | Digital subscription — non-refundable |

**Suggested prompts:**
- "I'd like to request a refund for order ORD-2024-8821. My Sony headphones stopped working."
- "Please refund order ORD-2024-7743 — I bought the wrong Adobe plan."
- "Can I get a refund for ORD-2024-1187? One earbud stopped working."

---

## 🔧 Agent Tool Architecture

The agent uses 8 function-calling tools executed in sequence:

```
1. getCustomerByOrderId()      → Fetch customer + order from CRM
2. getRefundPolicy()           → Load full policy document  
3. validateRefundWindow()      → Check ≤30 days since delivery
4. validateRefundHistory()     → Check <2 refunds in 12 months
5. validateProductEligibility()→ Block digital/custom/no-evidence
6. calculateRefundAmount()     → Full or partial refund amount
7. approveRefund()             → Record approval + transaction ID
   OR
   rejectRefund()              → Record rejection + violated rule
```

---

## 📜 Refund Policy Rules

| Rule | Condition |
|------|-----------|
| 30-Day Window | Request within 30 days of delivery |
| Delivery Required | Product must be delivered |
| Max 2 Refunds | Max 2 refunds per 12 months |
| Digital = Non-refundable | Software, subscriptions, digital content |
| Custom = Non-refundable | Unless defective with evidence |
| Damage needs evidence | Photos/video required |
| Amount ≤ Order value | Cannot exceed original price |

---

## 🏗 Architecture Decisions

### Why SSE over WebSockets?
Server-Sent Events are unidirectional, stateless, and perfectly suited for streaming agent steps from server to client. No handshake overhead, works through proxies, auto-reconnects.

### Why in-memory store?
For an assignment/demo context, in-memory is zero-dependency and always works. The `sessionStore` interface is identical to what a MongoDB or Redis implementation would expose — swapping is a single file change.

### Why no Zustand/TanStack Query?
The app is intentionally not over-engineered. React's built-in state is sufficient for this scope. Adding Zustand would be premature complexity for a demo with no shared cross-component state.

---

## 🎙 Voice Architecture (Bonus — Ready to Integrate)

The agent is voice-ready. To add voice:

1. **OpenAI Realtime API** — Replace SSE with WebSocket, stream audio chunks
2. **ElevenLabs TTS** — Pass final response text to ElevenLabs `/v1/text-to-speech`
3. **LiveKit** — Use LiveKit room for full-duplex audio sessions

Hooks to add:
- `useVoiceInput()` — Web Speech API / LiveKit mic capture
- `useTextToSpeech()` — ElevenLabs streaming audio playback
- `VoiceButton` component — already stubbed in `ChatInterface.tsx`

---

## 🚢 Deploy to Vercel

```bash
npm i -g vercel
vercel
# Add OPENAI_API_KEY in Vercel dashboard → Settings → Environment Variables
```

---

## 📹 Loom Walkthrough Script

1. **Landing page** — Hero, features overview
2. **Agent chat** — Type a refund request for ORD-2024-8821 (approved case)
3. **Watch tool calls** — Show streaming steps in chat
4. **Admin dashboard** — Show the session logged in real-time
5. **Edge case** — Try ORD-2024-7743 (digital product rejection)
6. **CRM** — Show customer profile + eligibility analysis
7. **Policy Center** — Walk through rules
8. **Code walkthrough** — `lib/agent/tools.ts`, `app/api/agent/route.ts`

---

## 👨‍💻 Author

Built as a Next.js Developer hiring assignment.
