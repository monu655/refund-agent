import { refundPolicy } from "@/lib/data/policy";

export async function GET() {
  return Response.json({ success: true, data: refundPolicy });
}
