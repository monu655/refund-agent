import { RefundPolicy } from "@/types";

export const refundPolicy: RefundPolicy = {
  version: "2.1.0",
  lastUpdated: "2024-01-01",
  rules: [
    {
      id: "RULE-001",
      title: "30-Day Return Window",
      description:
        "Refund requests must be submitted within 30 calendar days from the delivery date. Requests submitted after this window are automatically ineligible unless an exception is granted by a supervisor.",
      condition:
        "daysBetween(deliveryDate, refundRequestedDate) <= 30",
      examples: [
        {
          scenario: "Product delivered Nov 1, refund requested Nov 25",
          verdict: "pass",
          reason: "24 days within the 30-day window",
        },
        {
          scenario: "Product delivered Oct 1, refund requested Nov 5",
          verdict: "fail",
          reason: "35 days have passed, exceeds the 30-day limit",
        },
      ],
    },
    {
      id: "RULE-002",
      title: "Delivery Confirmation Required",
      description:
        "Products must be marked as delivered before a refund can be processed. If a product was never delivered, the case is escalated to a shipping dispute, not a standard refund.",
      condition: "deliveryDate !== null",
      examples: [
        {
          scenario: "Product shows delivered status in tracking system",
          verdict: "pass",
          reason: "Delivery confirmed",
        },
        {
          scenario: "Product still in transit or lost in shipping",
          verdict: "fail",
          reason: "Not eligible for standard refund — escalate to shipping dispute",
        },
      ],
    },
    {
      id: "RULE-003",
      title: "Maximum 2 Refunds Per 12 Months",
      description:
        "A customer may not receive more than 2 approved refunds in any rolling 12-month period. This rule prevents abuse of the refund policy.",
      condition: "previousRefundCount < 2",
      examples: [
        {
          scenario: "Customer has 1 previous refund in the last year",
          verdict: "pass",
          reason: "Under the 2-refund limit",
        },
        {
          scenario: "Customer already has 2 refunds in the last 12 months",
          verdict: "fail",
          reason: "Refund limit exceeded",
        },
      ],
    },
    {
      id: "RULE-004",
      title: "Digital Products Are Non-Refundable",
      description:
        "Digital products including software licenses, subscriptions, downloadable content, and digital media are non-refundable once accessed or activated.",
      condition: "category !== 'digital'",
      examples: [
        {
          scenario: "Customer requests refund on physical book",
          verdict: "pass",
          reason: "Physical product is eligible",
        },
        {
          scenario: "Customer requests refund on annual software subscription",
          verdict: "fail",
          reason: "Digital products are non-refundable",
        },
      ],
    },
    {
      id: "RULE-005",
      title: "Custom/Personalized Products Are Non-Refundable",
      description:
        "Products that are custom-made, personalized, or made-to-order are non-refundable unless they arrive damaged or defective.",
      condition:
        "category !== 'custom' || (category === 'custom' && evidenceProvided && isDamaged)",
      examples: [
        {
          scenario: "Custom jersey with name print — customer changed mind",
          verdict: "fail",
          reason: "Custom products are non-refundable for change of mind",
        },
        {
          scenario: "Custom jersey arrived with wrong name printed",
          verdict: "pass",
          reason: "Defective custom product with evidence is eligible",
        },
      ],
    },
    {
      id: "RULE-006",
      title: "Damaged Products Require Evidence",
      description:
        "If the refund reason involves a damaged, defective, or malfunctioning product, photographic or video evidence must be provided to process the refund.",
      condition: "if isDamaged then evidenceProvided === true",
      examples: [
        {
          scenario: "Customer claims product is broken and uploads photos",
          verdict: "pass",
          reason: "Damage evidence provided",
        },
        {
          scenario: "Customer claims product is broken but provides no evidence",
          verdict: "fail",
          reason: "Evidence required for damage claims",
        },
      ],
    },
    {
      id: "RULE-007",
      title: "Refund Amount Cannot Exceed Order Value",
      description:
        "The approved refund amount will never exceed the original order value. Partial refunds may be issued at agent discretion for partially usable goods.",
      condition: "refundAmount <= orderValue",
      examples: [
        {
          scenario: "Order value ₹5000, refund requested ₹5000",
          verdict: "pass",
          reason: "Refund equals order value — permitted",
        },
        {
          scenario: "Order value ₹5000, refund requested ₹6000",
          verdict: "fail",
          reason: "Refund cannot exceed original order value",
        },
      ],
    },
  ],
};

export const getPolicyText = (): string => {
  return refundPolicy.rules
    .map(
      (r) =>
        `${r.id}: ${r.title}\n${r.description}\nCondition: ${r.condition}`
    )
    .join("\n\n");
};
