/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS runner also loads transpiled schema modules. */
/* Run with `pnpm check:schemas`. Uses the project's existing TypeScript compiler; no test dependency. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const cache = new Map();
function load(file) {
  const absolute = path.resolve(root, file);
  if (cache.has(absolute)) return cache.get(absolute).exports;
  const mod = { exports: {} };
  cache.set(absolute, mod);
  const source = ts.transpileModule(fs.readFileSync(absolute, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023 },
  }).outputText;
  const localRequire = (id) =>
    id.startsWith("@/")
      ? load(`${id.slice(2)}.ts`)
      : id.startsWith(".")
        ? load(`${path.resolve(path.dirname(absolute), id)}.ts`)
        : require(id);
  vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename: absolute })(
    localRequire,
    mod,
    mod.exports
  );
  return mod.exports;
}
const s = load("constant/schema.client.ts");
const uuid = "b79c6550-755a-4cbe-9ac1-37d506f91b77";
const accept = (schema, value) =>
  assert.ok(schema.safeParse(value).success, JSON.stringify(schema.safeParse(value).error?.issues));
const reject = (schema, value) => assert.equal(schema.safeParse(value).success, false);

// Read contracts cover actual fixtures, so schemas cannot silently drift from the pages.
for (const [file, name, schema] of [
  ["marketplace", "INVESTMENTS", s.investmentSchema],
  ["investments", "HOLDINGS", s.holdingSchema],
  ["transactions", "TRANSACTIONS", s.transactionRowSchema],
  ["withdrawals", "CREDITS", s.creditRowSchema],
  ["support", "HELP_ARTICLES", s.helpArticleSchema],
  ["ask-ai", "MARKET_HISTORY", s.marketHistoryPointSchema],
  ["ask-ai", "RECOMMENDATION_HISTORY", s.recommendationRecordSchema],
]) {
  for (const row of load(`app/dashboard/(dashboard)/${file}/_data.ts`)[name]) accept(schema, row);
}
assert.deepEqual(s.paginationQuerySchema.parse({}), { page: 1, pageSize: 12 });
assert.equal(s.paginationQuerySchema.parse({ page: "2", pageSize: "25" }).page, 2);
reject(s.paginationQuerySchema, { page: 0 });
reject(s.paginationQuerySchema, { pageSize: 101 });
assert.equal(s.conversationListQuerySchema.parse({ pinned: "false" }).pinned, false);
reject(s.conversationListQuerySchema, { pinned: "yes" });
reject(s.transactionListQuerySchema, { from: "2026-11-06", to: "2026-10-01" });
reject(s.investmentListQuerySchema, { minUnitPrice: 200, maxUnitPrice: 100 });
reject(s.investmentListQuerySchema, { minRoi: 16, maxRoi: 12 });
for (const amount of [-1, Infinity, NaN, 0.001]) reject(s.amountSchema, amount);
accept(s.amountSchema, 23.45);
accept(s.fundingFormSchema, { amount: 250000, method: "bank" });
reject(s.fundingFormSchema, { amount: 0, method: "bank" });
reject(s.investmentQuoteRequestSchema, { investmentId: "golden", units: 1.5 });
reject(s.investmentQuoteRequestSchema, { investmentId: "golden", units: 1, unitPrice: 1 });
const consent = { risks: true, exit: true, agreement: true, name: "Demo User" };
const purchase = { quoteId: "quote-1", idempotencyKey: uuid, agreementVersion: "1.3", consent };
accept(s.purchaseInvestmentRequestSchema, purchase);
reject(s.purchaseInvestmentRequestSchema, { ...purchase, amount: 1 });
reject(s.purchaseInvestmentRequestSchema, { ...purchase, consent: { ...consent, risks: false } });
reject(s.purchaseInvestmentRequestSchema, { ...purchase, idempotencyKey: "" });
accept(s.createWithdrawalRequestSchema, {
  quoteId: "quote-2",
  pin: "0123",
  authenticatorCode: "012345",
  idempotencyKey: uuid,
});
reject(s.createWithdrawalRequestSchema, { quoteId: "quote-2", pin: "123", idempotencyKey: uuid });
reject(s.addressSchema, { country: "ZZ", address1: "Example street", address2: "", zip: "100001" });
accept(s.addressSchema, { country: "NG", address1: "Example street", address2: "", zip: "100001" });
const password = { oldPassword: "OldDemo1!", newPassword: "NewDemo2!", confirmPassword: "NewDemo2!" };
accept(s.passwordSchema, password);
reject(s.passwordSchema, { ...password, confirmPassword: "Mismatch1!" });
reject(s.passwordSchema, { ...password, newPassword: "short" });
reject(s.changePasswordRequestSchema, { ...password }); // Confirmation belongs to the form only.
accept(s.changePasswordRequestSchema, { oldPassword: password.oldPassword, newPassword: password.newPassword });
reject(s.deleteAccountFormSchema, { confirmation: "delete" });
reject(s.verifyTwoFactorRequestSchema, { challengeId: "challenge", code: "12345" });
reject(s.startTwoFactorResponseSchema, {
  method: "authenticator",
  challengeId: "challenge",
  expiresAt: "2026-11-06T12:00:00Z",
  setupUri: "https://example.com",
});
accept(s.profilePhotoFileSchema, new File(["preview"], "profile.png", { type: "image/png" }));
reject(s.profilePhotoFileSchema, new File(["preview"], "profile.svg", { type: "image/svg+xml" }));
reject(s.profilePhotoMetadataSchema, { fileName: "x.png", mimeType: "image/png", size: 6 * 1024 * 1024 });
assert.equal(
  s.recommendationPreferencesRequestSchema.parse({
    budget: "500000",
    horizon: "12",
    risk: "balanced",
    location: "all",
    portfolio: true,
  }).budget,
  500000
);
reject(s.recommendationPreferencesRequestSchema, {
  budget: "-1",
  horizon: "12",
  risk: "balanced",
  location: "all",
  portfolio: true,
});
reject(s.marketQuestionFormSchema, { question: "   " });
reject(s.sendChatMessageRequestSchema, { text: "x".repeat(2001) });
reject(s.renameConversationFormSchema, { title: "   " });
reject(s.updateConversationRequestSchema, {});
accept(s.updateConversationRequestSchema, { pinned: false });
reject(s.chatLinkSchema, { label: "unsafe", href: "javascript:alert(1)" });
accept(s.chatStreamEventSchema, { type: "delta", messageId: "message", text: "next token" });
reject(s.chatStreamEventSchema, { type: "delta", text: "missing ID" });
console.log(
  "Schema checks passed: current fixtures, requests, coercion, cross-field validation, uploads and security boundaries."
);

const adminFixtures = load("app/admin/(admin)/account/_data.ts");
adminFixtures.INITIAL_INVOICES.forEach((row) => accept(s.adminInvoiceSchema, row));
adminFixtures.ACCOUNT_TRANSACTIONS.forEach((row) => accept(s.adminAccountTransactionSchema, row));
const invoiceInput = Object.fromEntries(
  Object.entries(adminFixtures.INITIAL_INVOICES[0]).filter(([key]) => !["id", "status", "createdAt"].includes(key))
);
accept(s.adminInvoiceFormSchema, invoiceInput);
reject(s.adminInvoiceFormSchema, { ...invoiceInput, amount: -1 });
reject(s.adminInvoiceFormSchema, { ...invoiceInput, rate: 101 });
reject(s.adminInvoiceFormSchema, { ...invoiceInput, email: "invalid" });
reject(s.adminInvoiceFormSchema, { ...invoiceInput, dueDate: "2026-02-30" });
reject(s.adminInvoiceFormSchema, { ...invoiceInput, status: "paid" });
accept(s.createAdminInvoiceRequestSchema, { ...invoiceInput, intent: "draft", idempotencyKey: uuid });
console.log("Admin account fixtures and invoice validation passed.");

const people = load("app/admin/(admin)/_operations/data.ts");
people.INVESTORS.forEach((row) => accept(s.adminInvestorSchema, row));
people.STAFF.forEach((row) => accept(s.staffMemberSchema, row));
people.KYC_CASES.forEach((row) => accept(s.kycCaseSchema, row));
const statusRequest = {
  status: "suspended",
  currentStatus: "active",
  investorId: "CC-U014",
  reasonCode: "compliance-review",
  reason: "Review unusual withdrawal activity before release",
  reviewed: true,
  confirmation: "SUSPENDED",
  idempotencyKey: uuid,
};
accept(s.statusChangeRequestSchema, statusRequest);
reject(s.statusChangeRequestSchema, { ...statusRequest, confirmation: "" });
reject(s.statusChangeRequestSchema, { ...statusRequest, status: "active", confirmation: "ACTIVE" });
reject(s.statusChangeRequestSchema, { ...statusRequest, reviewed: false });
const roleRequest = {
  staffId: "staff-tunde",
  role: "compliance",
  reason: "Compliance team onboarding requires this role",
  requestedBy: "staff-nneka",
  approverId: "staff-zainab",
  idempotencyKey: uuid,
};
accept(s.roleChangeRequestSchema, roleRequest);
reject(s.roleChangeRequestSchema, { ...roleRequest, approverId: "staff-nneka" });
reject(s.roleChangeRequestSchema, { ...roleRequest, approverId: "staff-tunde" });
accept(s.kycDecisionFormSchema, {
  decision: "approve",
  reason: "Identity and address evidence reviewed and matched",
  message: "",
  reviewed: true,
});
reject(s.kycDecisionFormSchema, {
  decision: "reject",
  reason: "Identity and address evidence reviewed and mismatched",
  message: "",
  reviewed: true,
});
reject(s.kycDecisionFormSchema, {
  decision: "approve",
  reason: "Identity and address evidence reviewed and matched",
  message: "",
  reviewed: false,
});
reject(s.kycOverrideRequestSchema, {
  caseId: "KYC-304",
  reason: "Validation mismatch requires a second independent review",
  requestedBy: "staff-amaka",
  approverId: "staff-amaka",
  idempotencyKey: uuid,
});
reject(s.permissionChangeFormSchema, {
  approverId: "staff-zainab",
  permission: "Audit log",
  role: "super-admin",
  level: "Allowed",
  reason: "Should never allow editable audit records",
});
reject(s.staffVerificationSchema, { method: "authenticator", challengeId: "challenge", code: "12345" });
accept(s.staffVerificationSchema, { method: "authenticator", challengeId: "challenge", code: "123456" });
console.log("Admin people fixtures and review-request validation passed.");

const permissionRequest = {
  permission: "Investor profiles",
  role: "compliance",
  level: "Read only",
  reason: "Independent review of investor profile access",
  requestedBy: "staff-nneka",
  approverId: "staff-zainab",
  idempotencyKey: uuid,
};
accept(s.permissionChangeRequestSchema, permissionRequest);
reject(s.permissionChangeRequestSchema, { ...permissionRequest, approverId: "staff-nneka" });
people.CUSTOMER_HISTORY.forEach((row) => accept(s.adminCustomerHistoryPointSchema, row));

const offerings = load("app/admin/(admin)/investments/_data.ts").ADMIN_INVESTMENTS;
offerings.forEach((row) => accept(s.adminInvestmentSchema, row));
const offeringForm = s.adminInvestmentFormSchema.parse(offerings[0]);
reject(s.adminInvestmentFormSchema, { ...offeringForm, endDate: offeringForm.startDate });
reject(s.adminInvestmentFormSchema, { ...offeringForm, minimumUnits: offeringForm.totalUnits + 1 });
reject(s.adminInvestmentSchema, { ...offerings[0], totalUnits: offerings[0].allocatedUnits - 1 });
reject(s.publishAdminInvestmentSchema, { ...offeringForm, rightsConfirmed: false });
reject(s.publishAdminInvestmentSchema, { ...offeringForm, termsConfirmed: false });
accept(s.publishAdminInvestmentSchema, offeringForm);
reject(s.adminInvestmentFormSchema, { ...offeringForm, annualRoi: 101 });
reject(s.adminInvestmentFormSchema, { ...offeringForm, image: "../../private" });
reject(s.investmentCoverPreviewSchema, "data:image/svg+xml;base64,AAAA");
const coverless = Object.fromEntries(Object.entries(offeringForm).filter(([key]) => key !== "coverPreview"));
accept(s.createAdminInvestmentRequestSchema, { ...coverless, idempotencyKey: uuid, intent: "draft" });
reject(s.createAdminInvestmentRequestSchema, {
  ...coverless,
  idempotencyKey: uuid,
  intent: "review",
  termsConfirmed: false,
});
console.log("Admin investment fixtures and publication validation passed.");

reject(s.createAdminInvestmentRequestSchema, {
  ...coverless,
  idempotencyKey: uuid,
  intent: "draft",
  coverPreview: "data:image/png;base64,AAAA",
});
reject(s.createAdminInvestmentRequestSchema, {
  ...coverless,
  idempotencyKey: uuid,
  intent: "draft",
  allocatedUnits: 0,
});

const treasury = load("app/admin/(admin)/_operations/treasury-data.ts");
treasury.TREASURY_ACCOUNTS.forEach((row) => accept(s.treasuryAccountSchema, row));
treasury.WITHDRAWAL_QUEUE.forEach((row) => accept(s.adminWithdrawalSchema, row));
treasury.DISBURSEMENT_HISTORY.forEach((row) => accept(s.disbursementHistorySchema, row));
treasury.LEDGER_MAPPINGS.forEach((row) => accept(s.ledgerMappingSchema, row));
treasury.BANKING_RETRIES.forEach((row) => accept(s.bankingRetryRowSchema, row));
const preview = load("lib/treasury-preview.ts");
const schedule = {
  propertyId: "all",
  basis: "30/360",
  annualRate: 16,
  frequency: "quarterly",
  periodStart: "2026-07-01",
  periodEnd: "2026-09-30",
  creditDate: "2026-10-31",
  withholdingRate: 10,
  reason: "Quarterly distribution schedule for compliance review",
};
const dividends = preview.previewDividends(schedule, treasury.RETURN_COHORTS);
dividends.forEach((row) => accept(s.dividendGroupSchema, row));
assert.equal(
  dividends.reduce((sum, row) => sum + row.gross, 0),
  240000
);
assert.equal(
  dividends.reduce((sum, row) => sum + row.tax, 0),
  24000
);
assert.equal(
  dividends.reduce((sum, row) => sum + row.net, 0),
  216000
);
assert.equal(preview.previewDividends({ ...schedule, propertyId: "golden-estate" }, treasury.RETURN_COHORTS).length, 1);
assert.equal(
  preview.previewDividends(
    {
      ...schedule,
      propertyId: "golden-estate",
      basis: "actual/365",
      annualRate: 36.5,
      periodStart: "2024-02-28",
      periodEnd: "2024-02-29",
      creditDate: "2024-03-01",
    },
    [{ id: "golden-estate", name: "Test", principal: 1000, investors: 1 }]
  )[0].gross,
  2
);
reject(s.returnScheduleFormSchema, { ...schedule, creditDate: schedule.periodEnd });
reject(s.returnScheduleFormSchema, { ...schedule, periodEnd: "2026-06-01" });
reject(s.returnScheduleFormSchema, { ...schedule, withholdingRate: 101 });
assert.deepEqual(preview.withdrawalTotals([treasury.WITHDRAWAL_QUEUE[0], treasury.WITHDRAWAL_QUEUE[2]]), {
  recipients: 3000000,
  fees: 100,
  walletDebit: 3000100,
});
assert.deepEqual(preview.withdrawalTotals([]), { recipients: 0, fees: 0, walletDebit: 0 });
assert.throws(() => preview.withdrawalTotals([treasury.WITHDRAWAL_QUEUE[0], treasury.WITHDRAWAL_QUEUE[0]]));
const independent = {
  batchId: "DIV-010",
  requestedBy: "staff-tunde",
  checkerId: "staff-nneka",
  reason: "Independent funding and duplicate review",
  version: 1,
  idempotencyKey: uuid,
};
accept(s.independentBatchRequestSchema, independent);
reject(s.independentBatchRequestSchema, { ...independent, checkerId: "staff-tunde" });
reject(s.adminWithdrawalBatchRequestSchema, { ...independent, withdrawalIds: ["WD-041", "WD-041"] });
reject(s.manualLedgerFormSchema, {
  accountId: "escrow",
  direction: "debit",
  amount: 25000,
  counterAccount: "bank-charges",
  memo: "Bank fee review for monthly operating charges",
  supportingReference: "ST-881",
  checkerId: "staff-nneka",
});
reject(s.accrualOverrideFormSchema, {
  reference: "ACC-GE-0104",
  existing: 4000,
  proposed: 4000,
  reason: "Correct partial period accrual calculation",
  evidenceReference: "FIN-021",
  checkerId: "staff-nneka",
});
reject(s.settlementRetryRequestSchema, {
  reference: "SET-118",
  originalIdempotencyKey: "original-118",
  status: "unknown",
  duplicateCheck: "clear",
  reason: "Retry after checking the provider status",
});
accept(s.settlementRetryRequestSchema, {
  reference: "SET-118",
  originalIdempotencyKey: "original-118",
  status: "confirmed-not-settled",
  duplicateCheck: "clear",
  reason: "Retry after checking the provider status",
});
const config = {
  environment: "sandbox",
  endpoint: "https://sandbox.example.invalid/symplus",
  clientId: "client-preview",
  tenant: "sandbox-branch",
  timeoutSeconds: 30,
  reason: "Sandbox configuration pending independent review",
};
accept(s.bankingConfigFormSchema, config);
reject(s.bankingConfigFormSchema, { ...config, environment: "production" });
reject(s.bankingConfigFormSchema, { ...config, endpoint: "http://example.invalid" });
reject(s.bankingConfigFormSchema, { ...config, apiSecret: "must-not-be-persisted" });
reject(s.ledgerMappingSchema, {
  id: "invalid",
  event: "Deposit",
  debitAccount: "2010",
  creditAccount: "2010",
  state: "draft",
});
assert.equal(preview.csvCell('=HYPERLINK("https://example.invalid")').charCodeAt(1), 39);
console.log("Treasury fixtures, cent calculations, independent reviews and banking boundaries passed.");

// Growth and platform screens use the same validated fixtures as their local draft stores.
const growthSchemas = load("constant/schemas/admin-growth.ts");
const growthDefaults = load("app/admin/(admin)/growth/_data.ts").GROWTH_DEFAULTS;
accept(growthSchemas.adminGrowthStateSchema, growthDefaults);
reject(growthSchemas.adminGrowthStateSchema, { ...growthDefaults, subject: " " });
reject(growthSchemas.adminGrowthStateSchema, { ...growthDefaults, sms: "x".repeat(161) });
reject(growthSchemas.adminGrowthStateSchema, { ...growthDefaults, broadcastStatus: "approved" });
const platformSchemas = load("constant/schemas/admin-platform.ts");
const platformDefaults = load("app/admin/(admin)/platform/_data.ts").PLATFORM_DEFAULTS;
accept(platformSchemas.adminPlatformStateSchema, platformDefaults);
reject(platformSchemas.adminPlatformStateSchema, { ...platformDefaults, environment: "production" });
reject(platformSchemas.adminPlatformStateSchema, { ...platformDefaults, windowEnd: platformDefaults.windowStart });
reject(platformSchemas.adminPlatformStateSchema, { ...platformDefaults, status: "pending", reviewed: false });
accept(platformSchemas.adminPlatformStateSchema, { ...platformDefaults, status: "pending", reviewed: true });
const matrixChange = { operation: "withdrawal", fee: 50, perTransaction: 2000000, dailyLimit: 5000000 };
accept(platformSchemas.platformMatrixChangeSchema, matrixChange);
reject(platformSchemas.platformMatrixChangeSchema, { ...matrixChange, fee: -1 });
reject(platformSchemas.platformMatrixChangeSchema, { ...matrixChange, dailyLimit: 1000 });
console.log("Growth drafts and platform limits, maintenance windows and review validation passed.");
