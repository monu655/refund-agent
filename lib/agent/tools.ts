import { customers, getCustomerByOrderId } from "@/lib/data/customers";
import { refundPolicy, getPolicyText } from "@/lib/data/policy";
import { Customer } from "@/types";

// ─── Tool Definitions for OpenAI ─────────────────────────────────────────────

export const TOOL_DEFINITIONS = [
  {
    type: "function" as const,
    function: {
      name: "getCustomerByOrderId",
      description:
        "Fetches customer details and order information from the CRM database using the order ID.",
      parameters: {
        type: "object",
        properties: {
          orderId: {
            type: "string",
            description: "The order ID to look up (e.g. ORD-2024-8821)",
          },
        },
        required: ["orderId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getRefundPolicy",
      description:
        "Retrieves the complete refund policy document with all rules, conditions, and examples.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "validateRefundWindow",
      description:
        "Checks if the refund request is within the 30-day return window from delivery date.",
      parameters: {
        type: "object",
        properties: {
          orderId: { type: "string", description: "The order ID" },
        },
        required: ["orderId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "validateRefundHistory",
      description:
        "Checks if customer has exceeded the maximum 2 refunds in 12 months limit.",
      parameters: {
        type: "object",
        properties: {
          orderId: { type: "string", description: "The order ID" },
        },
        required: ["orderId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "validateProductEligibility",
      description:
        "Validates if the product category and type is eligible for a refund (checks digital/custom product rules).",
      parameters: {
        type: "object",
        properties: {
          orderId: { type: "string", description: "The order ID" },
        },
        required: ["orderId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "calculateRefundAmount",
      description:
        "Calculates the eligible refund amount based on order value, product condition, and policy rules.",
      parameters: {
        type: "object",
        properties: {
          orderId: { type: "string", description: "The order ID" },
        },
        required: ["orderId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "approveRefund",
      description:
        "Approves the refund request and records the decision with the calculated refund amount.",
      parameters: {
        type: "object",
        properties: {
          orderId: { type: "string", description: "The order ID" },
          refundAmount: {
            type: "number",
            description: "The approved refund amount",
          },
          reasoning: {
            type: "string",
            description: "Brief explanation of why the refund was approved",
          },
        },
        required: ["orderId", "refundAmount", "reasoning"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "rejectRefund",
      description:
        "Rejects the refund request and records the decision with the reason.",
      parameters: {
        type: "object",
        properties: {
          orderId: { type: "string", description: "The order ID" },
          reason: {
            type: "string",
            description: "Specific policy rule violated or reason for rejection",
          },
        },
        required: ["orderId", "reason"],
      },
    },
  },
];

// ─── Tool Executor ────────────────────────────────────────────────────────────

interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

export function executeTool(
  name: string,
  args: Record<string, unknown>
): ToolResult {
  try {
    switch (name) {
      case "getCustomerByOrderId": {
        const customer = getCustomerByOrderId(args.orderId as string);
        if (!customer) {
          return {
            success: false,
            error: `No customer found with order ID: ${args.orderId}`,
          };
        }
        return { success: true, data: customer };
      }

      case "getRefundPolicy": {
        return {
          success: true,
          data: {
            policy: refundPolicy,
            text: getPolicyText(),
          },
        };
      }

      case "validateRefundWindow": {
        const customer = getCustomerByOrderId(args.orderId as string);
        if (!customer) return { success: false, error: "Customer not found" };

        if (!customer.deliveryDate) {
          return {
            success: true,
            data: {
              valid: false,
              reason:
                "Product has not been delivered yet. Cannot process standard refund. Escalate to shipping dispute.",
              delivered: false,
            },
          };
        }

        const days = daysBetween(
          customer.deliveryDate,
          customer.refundRequestedDate
        );
        const valid = days <= 30;

        return {
          success: true,
          data: {
            valid,
            daysSinceDelivery: days,
            deliveryDate: customer.deliveryDate,
            refundRequestedDate: customer.refundRequestedDate,
            reason: valid
              ? `Request is within the 30-day window (${days} days after delivery)`
              : `Request is outside the 30-day window (${days} days after delivery)`,
          },
        };
      }

      case "validateRefundHistory": {
        const customer = getCustomerByOrderId(args.orderId as string);
        if (!customer) return { success: false, error: "Customer not found" };

        const valid = customer.previousRefundCount < 2;
        return {
          success: true,
          data: {
            valid,
            previousRefundCount: customer.previousRefundCount,
            reason: valid
              ? `Customer has ${customer.previousRefundCount} previous refund(s) — within the 2-refund limit`
              : `Customer has ${customer.previousRefundCount} previous refund(s) — exceeds the 2-refund limit`,
          },
        };
      }

      case "validateProductEligibility": {
        const customer = getCustomerByOrderId(args.orderId as string);
        if (!customer) return { success: false, error: "Customer not found" };

        if (customer.category === "digital") {
          return {
            success: true,
            data: {
              valid: false,
              reason:
                "Digital products are non-refundable once accessed or activated (RULE-004)",
              category: customer.category,
            },
          };
        }

        if (customer.category === "custom") {
          const isDamageClaim =
            customer.refundReason.toLowerCase().includes("damage") ||
            customer.refundReason.toLowerCase().includes("wrong") ||
            customer.refundReason.toLowerCase().includes("defect") ||
            customer.refundReason.toLowerCase().includes("crack") ||
            customer.refundReason.toLowerCase().includes("broken");

          if (!isDamageClaim) {
            return {
              success: true,
              data: {
                valid: false,
                reason:
                  "Custom/personalized products are non-refundable for change-of-mind returns (RULE-005)",
                category: customer.category,
              },
            };
          }

          if (!customer.evidenceProvided) {
            return {
              success: true,
              data: {
                valid: false,
                reason:
                  "Damaged custom products require photographic evidence (RULE-006)",
                category: customer.category,
              },
            };
          }

          return {
            success: true,
            data: {
              valid: true,
              reason:
                "Custom product with damage claim and evidence provided — eligible",
              category: customer.category,
            },
          };
        }

        const isDamageClaim =
          customer.refundReason.toLowerCase().includes("damage") ||
          customer.refundReason.toLowerCase().includes("broken") ||
          customer.refundReason.toLowerCase().includes("defect") ||
          customer.refundReason.toLowerCase().includes("crack") ||
          customer.refundReason.toLowerCase().includes("noise") ||
          customer.refundReason.toLowerCase().includes("stopped working") ||
          customer.refundReason.toLowerCase().includes("peeling") ||
          customer.refundReason.toLowerCase().includes("pixels") ||
          customer.refundReason.toLowerCase().includes("grinding");

        if (isDamageClaim && !customer.evidenceProvided) {
          return {
            success: true,
            data: {
              valid: false,
              reason:
                "Damage/defect claims require photographic or video evidence (RULE-006)",
              category: customer.category,
            },
          };
        }

        return {
          success: true,
          data: {
            valid: true,
            reason: `Product category "${customer.category}" is eligible for refund`,
            category: customer.category,
          },
        };
      }

      case "calculateRefundAmount": {
        const customer = getCustomerByOrderId(args.orderId as string);
        if (!customer) return { success: false, error: "Customer not found" };

        // Full refund for defective/wrong items
        const isDefective =
          customer.refundReason.toLowerCase().includes("defect") ||
          customer.refundReason.toLowerCase().includes("broken") ||
          customer.refundReason.toLowerCase().includes("wrong") ||
          customer.refundReason.toLowerCase().includes("damage") ||
          customer.refundReason.toLowerCase().includes("crack") ||
          customer.refundReason.toLowerCase().includes("noise") ||
          customer.refundReason.toLowerCase().includes("stopped working") ||
          customer.refundReason.toLowerCase().includes("pixels") ||
          customer.refundReason.toLowerCase().includes("missing") ||
          customer.refundReason.toLowerCase().includes("peeling");

        const refundAmount = isDefective
          ? customer.orderValue
          : Math.round(customer.orderValue * 0.9); // 10% restocking for non-defective

        return {
          success: true,
          data: {
            refundAmount,
            orderValue: customer.orderValue,
            isFullRefund: refundAmount === customer.orderValue,
            reason: isDefective
              ? "Full refund for defective/incorrect product"
              : "90% refund (10% restocking fee applied for change-of-mind returns)",
          },
        };
      }

      case "approveRefund": {
        // In production this would write to DB
        return {
          success: true,
          data: {
            approved: true,
            orderId: args.orderId,
            refundAmount: args.refundAmount,
            reasoning: args.reasoning,
            transactionId: `TXN-${Date.now()}`,
            processedAt: new Date().toISOString(),
            estimatedCreditDays: 5,
          },
        };
      }

      case "rejectRefund": {
        return {
          success: true,
          data: {
            rejected: true,
            orderId: args.orderId,
            reason: args.reason,
            processedAt: new Date().toISOString(),
          },
        };
      }

      default:
        return { success: false, error: `Unknown tool: ${name}` };
    }
  } catch (error) {
    return {
      success: false,
      error: `Tool execution error: ${(error as Error).message}`,
    };
  }
}
