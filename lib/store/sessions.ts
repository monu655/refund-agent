import { AgentSession } from "@/types";

// In-memory store (replace with Redis/MongoDB in production)
const sessions = new Map<string, AgentSession>();
const activityLog: Array<{
  id: string;
  sessionId: string;
  orderId: string;
  customerName: string;
  decision: "approved" | "rejected" | "pending";
  amount?: number;
  timestamp: string;
  duration: number;
}> = [];

export const sessionStore = {
  create(session: AgentSession) {
    sessions.set(session.sessionId, session);
    return session;
  },

  get(sessionId: string): AgentSession | undefined {
    return sessions.get(sessionId);
  },

  update(sessionId: string, updates: Partial<AgentSession>): AgentSession | undefined {
    const session = sessions.get(sessionId);
    if (!session) return undefined;
    const updated = { ...session, ...updates };
    sessions.set(sessionId, updated);
    return updated;
  },

  getAll(): AgentSession[] {
    return Array.from(sessions.values()).sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  },

  addActivityLog(entry: (typeof activityLog)[0]) {
    activityLog.unshift(entry);
    if (activityLog.length > 100) activityLog.pop();
  },

  getActivityLog() {
    return activityLog;
  },

  getStats() {
    const all = Array.from(sessions.values()).filter(s => s.status === "completed");
    const approved = all.filter(s => s.decision === "approved");
    const rejected = all.filter(s => s.decision === "rejected");

    const totalDuration = all.reduce((sum, s) => {
      if (s.endTime) {
        return sum + (new Date(s.endTime).getTime() - new Date(s.startTime).getTime());
      }
      return sum;
    }, 0);

    return {
      totalRequests: all.length,
      approvedRefunds: approved.length,
      rejectedRefunds: rejected.length,
      pendingRefunds: Array.from(sessions.values()).filter(s => s.status === "running").length,
      approvalRate: all.length > 0 ? Math.round((approved.length / all.length) * 100) : 0,
      avgResolutionTime: all.length > 0 ? Math.round(totalDuration / all.length / 1000) : 0,
      totalRefundAmount: approved.reduce((sum, s) => sum + (s.refundAmount ?? 0), 0),
    };
  },
};
