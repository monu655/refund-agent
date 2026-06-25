import { sessionStore } from "@/lib/store/sessions";

export async function GET() {
  return Response.json({
    success: true,
    data: {
      stats: sessionStore.getStats(),
      activityLog: sessionStore.getActivityLog(),
    },
  });
}
