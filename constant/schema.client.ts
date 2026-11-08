/** Public Zod contracts for forms and future API boundaries. See schemas/README.md for the wiring map. */
export * from "./schemas/common";
export * from "./schemas/dashboard";
export * from "./schemas/marketplace";
export * from "./schemas/referrals";
export * from "./schemas/portfolio";
export * from "./schemas/settings";
export * from "./schemas/finance";
export * from "./schemas/insights";
export * from "./schemas/ai";
export * from "./schemas/support";
export * from "./schemas/admin";
// Existing authentication, onboarding and withdrawal forms keep their established contracts.
export * from "./auth";
export * from "./onboarding";
export { withdrawalDetailsSchema, withdrawalSchema, type WithdrawalFormData } from "./withdrawal";

export * from "./schemas/admin-account";

export * from "./schemas/admin-people";

export * from "./schemas/admin-investments";

export * from "./schemas/admin-treasury";

export * from "./schemas/admin-settings";
export * from "./schemas/admin-reports";
export * from "./schemas/admin-support";
export * from "./schemas/admin-content";
