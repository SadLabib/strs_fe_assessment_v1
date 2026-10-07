import { z } from "zod";

import {
  DEAL_TAGS,
  type DealTag,
  RATINGS,
  TRAINING_STATUSES,
} from "@/lib/domain";

// Only fields the UI uses are listed; Zod drops everything else.

/** The API sends decimals as strings ("125000.00"); convert them once, here. */
const decimal = z.union([z.string(), z.number()]).transform((value, ctx) => {
  const number = Number(value);
  if (value === "" || !Number.isFinite(number)) {
    ctx.addIssue({
      code: "custom",
      message: `Expected a decimal, got "${value}"`,
    });
    return z.NEVER;
  }
  return number;
});
const nullableDecimal = decimal.nullable();

/** Links shown in the UI must be https; anything else becomes null instead of failing the page. */
const httpsUrl = z
  .url({ protocol: /^https$/ })
  .nullable()
  .catch(null);

// ---------------------------------------------------------------- dashboard --

export const dashboardPropertySchema = z.object({
  zpid: z.string(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  unformatted_price: nullableDecimal,
  beds: z.int().nullable(),
  baths: z.number().nullable(),
  area: z.int().nullable(),
  img_src: httpsUrl,
  home_type: z.string().nullable(),
  market_id: z.int().nullable(),
  market_name: z.string().nullable(),
  status: z.enum(TRAINING_STATUSES),
  attempts: z.int(),
  latest_accuracy: nullableDecimal,
  latest_rating: z.enum(RATINGS).nullable(),
  best_accuracy: nullableDecimal,
  best_rating: z.enum(RATINGS).nullable(),
  active_underwriting_id: z.int().nullable(),
  latest_submission_id: z.int().nullable(),
});

export const dashboardSchema = z.object({
  summary: z.object({
    total_properties: z.int(),
    submitted: z.int(),
    in_progress: z.int(),
    not_started: z.int(),
    average_accuracy: nullableDecimal,
  }),
  properties: z.array(dashboardPropertySchema),
});

// ---------------------------------------------------- properties & markets --

export const propertySchema = z.object({
  zpid: z.string(),
  img_src: httpsUrl,
  detail_url: httpsUrl,
  unformatted_price: nullableDecimal,
  address: z.string().nullable(),
  address_street: z.string().nullable(),
  address_city: z.string().nullable(),
  address_state: z.string().nullable(),
  address_zipcode: z.string().nullable(),
  beds: z.int().nullable(),
  baths: z.number().nullable(),
  area: z.int().nullable(),
  home_type: z.string().nullable(),
  time_on_zillow: z.string().nullable(),
  market_id: z.int().nullable(),
  market: z.object({ id: z.int(), name: z.string() }).nullable(),
});

export const marketSchema = z.object({
  id: z.int(),
  name: z.string(),
  state: z.string().nullable(),
  region: z.string().nullable(),
  description: z.string().nullable(),
  property_count: z.int(),
});

// ------------------------------------------------------------ underwritings --

// Saved inputs come back with the derived numbers merged in once the API can
// calculate them, so every derived field is optional.

const purchaseDetailsSchema = z.object({
  purchase_price: decimal,
  down_payment_pct: decimal,
  interest_rate: decimal,
  mortgage_years: z.int(),
  closing_costs_pct: decimal,
  down_payment_amount: decimal.optional(),
  loan_amount: decimal.optional(),
  closing_costs_amount: decimal.optional(),
});

const scenarioSchema = z.object({
  forecasted_revenue: decimal,
  operating_expenses_annual: decimal.optional(),
  co_hosting_fee: decimal.optional(),
  net_operating_income: decimal.optional(),
  debt_service_annual: decimal.optional(),
  annual_free_cash_flow: decimal.optional(),
  cash_on_cash_pct: decimal.optional(),
});

const forecastedRevenueSchema = z.object({
  co_hosting_fee_pct: decimal,
  annual_re_appreciation_pct: decimal,
  scenarios: z.object({
    low: scenarioSchema,
    mid: scenarioSchema,
    high: scenarioSchema,
  }),
});

const taxesSchema = z.object({
  land_assumptions_pct: nullableDecimal,
  sla_multiplier_pct: nullableDecimal,
  bonus_amount_pct: nullableDecimal,
  tax_rate_pct: nullableDecimal,
  tax_savings: nullableDecimal,
});

const dealTagsShape = Object.fromEntries(
  DEAL_TAGS.map((tag) => [tag, z.boolean().nullable()]),
) as Record<DealTag, z.ZodNullable<z.ZodBoolean>>;

export const underwritingSchema = z.object({
  id: z.int(),
  zpid: z.string().nullable(),
  market_id: z.int().nullable(),
  is_reference: z.boolean(),
  deal_status: z.string().nullable(),
  deal_submitted: z.string().nullable(),
  property_address: z.string().nullable(),
  purchase_price: nullableDecimal,
  total_oop: nullableDecimal,
  prr: nullableDecimal,
  low_gross_revenue: nullableDecimal,
  mid_gross_revenue: nullableDecimal,
  high_gross_revenue: nullableDecimal,
  l_cash_on_cash: nullableDecimal,
  m_cash_on_cash: nullableDecimal,
  h_cash_on_cash: nullableDecimal,
  optimization_total: nullableDecimal,
  operating_expense_total: nullableDecimal,
  ...dealTagsShape,
  updated_at: z.string().nullable(),
  detail: z
    .object({
      purchase_details: purchaseDetailsSchema.nullable(),
      forecasted_revenue: forecastedRevenueSchema.nullable(),
    })
    .nullable(),
  taxes: taxesSchema.nullable(),
  optimization_items: z.array(
    z.object({
      id: z.int(),
      category: z.string().nullable(),
      total_price: nullableDecimal,
    }),
  ),
  operating_expenses: z.array(
    z.object({
      id: z.int(),
      expense_name: z.string().nullable(),
      monthly_amount: nullableDecimal,
    }),
  ),
});

// -------------------------------------------------------------- submissions --

export const submissionSchema = z.object({
  id: z.int(),
  underwriting_id: z.int(),
  // reference_underwriting_id is intentionally not parsed: the app never loads the reference.
  zpid: z.string(),
  rating: z.enum(RATINGS),
  accuracy: decimal,
  breakdown: z.object({
    label: z.string(),
    candidate: nullableDecimal,
    reference: nullableDecimal,
    deviation: decimal,
    best_threshold: decimal,
    medium_threshold: decimal,
  }),
  submitted_at: z.string(),
});

export const submitResultSchema = z.object({
  submission: submissionSchema,
  underwriting: underwritingSchema,
  dashboard: dashboardSchema,
});

export type Dashboard = z.infer<typeof dashboardSchema>;
export type DashboardProperty = z.infer<typeof dashboardPropertySchema>;
export type Property = z.infer<typeof propertySchema>;
export type Market = z.infer<typeof marketSchema>;
export type Underwriting = z.infer<typeof underwritingSchema>;
export type Submission = z.infer<typeof submissionSchema>;
export type SubmitResult = z.infer<typeof submitResultSchema>;
