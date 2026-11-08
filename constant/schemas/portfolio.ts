import { z } from "zod";

import { amountSchema, dateSchema, positiveAmountSchema, resourceIdSchema, unitsSchema } from "./common";
import { propertySchema } from "./marketplace";

// Mirrors the mobile `Holding` model (GET /portfolio/holdings, GET /portfolio/holdings/{id}).
export const holdingStatusSchema = z.enum(["active", "matured"]);
export const holdingSchema = z
  .object({
    id: resourceIdSchema,
    property: propertySchema,
    units: unitsSchema,
    amountInvested: positiveAmountSchema,
    startDate: dateSchema,
    maturityDate: dateSchema,
    status: holdingStatusSchema,
  })
  .refine((v) => v.startDate <= v.maturityDate, {
    path: ["maturityDate"],
    message: "Maturity must follow the start date",
  });
export const holdingListResponseSchema = z.array(holdingSchema);
export const holdingParamsSchema = z.object({ id: resourceIdSchema });

// Derived on the client from the holdings list, as the app does; not an endpoint.
export const portfolioSummarySchema = z.object({
  invested: amountSchema,
  accruedYield: amountSchema,
  expectedAtMaturity: amountSchema,
});

export type Holding = z.infer<typeof holdingSchema>;
export type HoldingStatus = z.infer<typeof holdingStatusSchema>;
export type PortfolioSummary = z.infer<typeof portfolioSummarySchema>;
