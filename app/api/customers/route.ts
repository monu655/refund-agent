import { getAllCustomers } from "@/lib/data/customers";

export async function GET() {
  const customers = getAllCustomers();
  return Response.json({ success: true, data: customers });
}
