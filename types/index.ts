// ─── Customer & Order Types ──────────────────────────────────────────────────

export type CustomerTier = "bronze" | "silver" | "gold" | "platinum";
export type RefundStatus = "pending" | "approved" | "rejected" | "processing";
export type ProductCategory =
  | "electronics"
  | "clothing"
  | "digital"
  | "furniture"
  | "custom"
  | "books"
  | "toys"
  | "sports";

export interface Customer {
  customerId: string;
  name: string;
  email: string;
  phone: string;
  orderId: string;
  productName: string;
  category: ProductCategory;
  purchaseDate: string;
  deliveryDate: string | null;
  orderValue: number;
  refundRequestedDate: string;
  refundReason: string;
  customerTier: CustomerTier;
  previousRefundCount: number;
  evidenceProvided: boolean;
  refundStatus?: RefundStatus;
  refundAmount?: number;
}

// ─── Agent & Tool Types ───────────────────────────────────────────────────────

export type ToolName =
  | "getCustomerByOrderId"
  | "getRefundPolicy"
  | "validateRefundWindow"
  | "validateRefundHistory"
  | "validateProductEligibility"
  | "calculateRefundAmount"
  | "approveRefund"
  | "rejectRefund";

export type ToolStatus = "pending" | "running" | "success" | "error";

export interface ToolCall {
  id: string;
  name: ToolName;
  arguments: Record<string, unknown>;
  result?: unknown;
  status: ToolStatus;
  duration?: number;
  timestamp: string;
}

export interface AgentStep {
  step: number;
  type:
    | "user_request"
    | "tool_call"
    | "tool_result"
    | "policy_validation"
    | "decision"
    | "final_response";
  title: string;
  content: string;
  toolCall?: ToolCall;
  timestamp: string;
}

export interface AgentSession {
  sessionId: string;
  orderId: string;
  customer?: Customer;
  steps: AgentStep[];
  decision?: "approved" | "rejected" | "pending";
  refundAmount?: number;
  reasoning?: string;
  startTime: string;
  endTime?: string;
  status: "running" | "completed" | "error";
}

// ─── Chat Types ───────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  toolCalls?: ToolCall[];
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  agentSession?: AgentSession;
  createdAt: string;
}

// ─── Dashboard Types ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalRequests: number;
  approvedRefunds: number;
  rejectedRefunds: number;
  pendingRefunds: number;
  approvalRate: number;
  avgResolutionTime: number; // minutes
  totalRefundAmount: number;
}

export interface RefundTrendPoint {
  date: string;
  approved: number;
  rejected: number;
  total: number;
}

export interface ActivityLog {
  id: string;
  sessionId: string;
  orderId: string;
  customerName: string;
  decision: "approved" | "rejected" | "pending";
  amount?: number;
  timestamp: string;
  duration: number;
}

// ─── Policy Types ─────────────────────────────────────────────────────────────

export interface PolicyRule {
  id: string;
  title: string;
  description: string;
  condition: string;
  examples: { scenario: string; verdict: "pass" | "fail"; reason: string }[];
}

export interface RefundPolicy {
  version: string;
  lastUpdated: string;
  rules: PolicyRule[];
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AgentResponse {
  sessionId: string;
  decision: "approved" | "rejected";
  refundAmount?: number;
  reasoning: string;
  steps: AgentStep[];
  customer?: Customer;
}
