/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS runner also loads transpiled schema modules. */
/* Run with `pnpm check:schemas`. Uses the project's existing TypeScript compiler; no test dependency. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const cache = new Map();
function resolveModule(base) {
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  for (const ext of [".ts", ".tsx"]) if (fs.existsSync(base + ext)) return base + ext;
  return `${base}.ts`;
}
function load(file) {
  const absolute = resolveModule(path.resolve(root, file));
  if (cache.has(absolute)) return cache.get(absolute).exports;
  const mod = { exports: {} };
  cache.set(absolute, mod);
  const source = ts.transpileModule(fs.readFileSync(absolute, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const localRequire = (id) =>
    id.startsWith("@/")
      ? load(id.slice(2))
      : id.startsWith(".")
        ? load(path.resolve(path.dirname(absolute), id))
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
const page = (file) => load(`app/dashboard/(dashboard)/${file}`);
for (const [file, name, schema] of [
  ["marketplace/page.tsx", "PROPERTIES", s.propertySchema],
  ["investments/_data.ts", "HOLDINGS", s.holdingSchema],
  ["transactions/_data.ts", "TRANSACTIONS", s.transactionSchema],
  ["support/_data.ts", "HELP_ARTICLES", s.helpArticleSchema],
  ["ask-ai/_data.ts", "MARKET_HISTORY", s.marketHistoryPointSchema],
  ["ask-ai/_data.ts", "RECOMMENDATION_HISTORY", s.recommendationRecordSchema],
]) {
  for (const row of page(file)[name]) accept(schema, row);
}
const home = page("_data.ts").HOME_DASHBOARD;
accept(s.homeDashboardSchema, home);
reject(s.homeDashboardSchema, { ...home, kycStatus: "in-review" });
const wallet = page("wallet/_data.ts").WALLET;
accept(s.walletSchema, wallet);
reject(s.walletSchema, { ...wallet, payoutAccount: { ...wallet.payoutAccount, accountNumber: "12345" } });
const notifications = load("constant/notifications.ts");
accept(notifications.inboxResponseSchema, notifications.NOTIFICATIONS);
reject(notifications.inboxMessageSchema, { ...notifications.NOTIFICATIONS[0], topic: "security" });

// Mobile model rules: unit bounds, holding dates, PIN, minimums and strict request bodies.
const [property] = page("marketplace/page.tsx").PROPERTIES;
reject(s.propertySchema, { ...property, unitsSold: property.totalUnits + 1 });
reject(s.propertySchema, { ...property, minUnits: property.maxUnits + 1 });
reject(s.propertySchema, { ...property, status: "active" });
const [holding] = page("investments/_data.ts").HOLDINGS;
reject(s.holdingSchema, { ...holding, maturityDate: "2000-01-01" });
reject(s.holdingSchema, { ...holding, status: "pending" });
for (const pin of ["0000", "123", "12345", "12a4"]) reject(s.transactionPinSchema, pin);
accept(s.investRequestSchema, { units: 2, pin: "1234" });
accept(s.investRequestSchema, {
  units: 2,
  pin: "1234",
  agreementVersion: "1.3",
  signatureName: "Ada",
  idempotencyKey: uuid,
});
reject(s.investRequestSchema, { units: 1.5, pin: "1234" });
reject(s.investRequestSchema, { units: 1, pin: "1234", unitPrice: 1 });
accept(s.withdrawRequestSchema, { amount: 1000, pin: "1234" });
reject(s.withdrawRequestSchema, { amount: 999, pin: "1234" });
reject(s.withdrawRequestSchema, { amount: 5000, pin: "1234", bankAccount: "other" });
accept(s.fundWithCardRequestSchema, { amount: 1000 });
reject(s.fundWithCardRequestSchema, { amount: 999 });
accept(s.fundingFormSchema, { amount: 250000, method: "bank" });
reject(s.fundingFormSchema, { amount: 0, method: "bank" });
reject(s.fundingFormSchema, { amount: 500, method: "card" });
const withdrawal = load("constant/withdrawal.ts").withdrawalSchema(wallet.balance);
accept(withdrawal, { amount: 1000, pin: "1234", authenticatorCode: "" });
reject(withdrawal, { amount: wallet.balance + 1, pin: "1234", authenticatorCode: "" });
accept(s.ninIdentitySchema, {
  nin: "00000000001",
  firstName: "Ada",
  surname: "Okafor",
  dateOfBirth: "1995-06-15",
  phone: "+234 8000000000",
});
reject(s.identitySchema, {
  nin: "00000000001",
  identity: null,
  address: "1 Demo Street",
  city: "Ikeja",
  stateOfResidence: "Lagos",
  lgaOfResidence: "Ikeja",
});

// Holding getters match the app: Marina Heights (5 units, 17%, 12 months) pays back ₦1,755,000.
const portfolio = page("investments/_data.ts");
const marina = portfolio.HOLDINGS.find((h) => h.id === "h_marina");
assert.equal(portfolio.progress(marina), 1);
assert.equal(portfolio.payoutAtMaturity(marina), 1755000);
assert.equal(portfolio.accruedYield({ ...holding, status: "active" }, holding.startDate), 0);

// The wire format is snake_case; fromApi(toApi(x)) must give back the same camelCase object.
const api = load("lib/api.ts");
const wireProperty = api.toApi(s.propertySchema, property);
assert.ok("unit_price" in wireProperty && "target_roi" in wireProperty && !("unitPrice" in wireProperty));
assert.deepEqual(api.fromApi(s.propertySchema, wireProperty), s.propertySchema.parse(property));
assert.deepEqual(
  api.fromApi(s.homeDashboardSchema, api.toApi(s.homeDashboardSchema, home)),
  s.homeDashboardSchema.parse(home)
);
assert.deepEqual(Object.keys(api.toApi(s.withdrawRequestSchema, { amount: 5000, pin: "1234", idempotencyKey: uuid })), [
  "amount",
  "pin",
  "idempotency_key",
]);
console.log("Mobile contracts, fixtures, rules and snake_case boundary passed.");

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
accept(s.staffInviteFormSchema, {
  name: "Seyi Adeyemi",
  email: "seyi@citycore.example",
  role: "finance",
  reason: "Finance needs another reviewer for withdrawal batches",
  approverId: "staff-zainab",
});
reject(s.staffInviteFormSchema, {
  name: "Seyi Adeyemi",
  email: "not-an-email",
  role: "finance",
  reason: "Finance needs another reviewer for withdrawal batches",
  approverId: "staff-zainab",
});
accept(s.roleChangeRequestSchema, roleRequest);
reject(s.roleChangeRequestSchema, { ...roleRequest, approverId: "staff-nneka" });
reject(s.roleChangeRequestSchema, { ...roleRequest, approverId: "staff-tunde" });
accept(s.kycDecisionFormSchema, {
  decision: "approve",
  reason: "Identity and address evidence reviewed and matched",
  message: "",
  reviewed: true,
});
assert.equal(s.investorKycAfterDecision.approve, "verified");
assert.equal(s.investorKycAfterDecision.reject, "actionRequired");
assert.equal(s.investorKycAfterDecision["request-information"], "actionRequired");
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
reject(s.adminInvestmentFormSchema, { ...offeringForm, minUnits: offeringForm.totalUnits + 1 });
reject(s.adminInvestmentFormSchema, { ...offeringForm, minUnits: offeringForm.maxUnits + 1 });
reject(s.adminInvestmentSchema, { ...offerings[0], totalUnits: offerings[0].unitsSold - 1 });
const admin = load("app/admin/(admin)/investments/_data.ts");
offerings.forEach((row) => accept(s.propertySchema, admin.toProperty(row)));
reject(s.publishAdminInvestmentSchema, { ...offeringForm, rightsConfirmed: false });
reject(s.publishAdminInvestmentSchema, { ...offeringForm, termsConfirmed: false });
accept(s.publishAdminInvestmentSchema, offeringForm);
reject(s.adminInvestmentFormSchema, { ...offeringForm, targetRoi: 101 });
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
  unitsSold: 0,
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
  fees: 0,
  walletDebit: 3000000,
});
treasury.WITHDRAWAL_QUEUE.forEach((row) =>
  accept(s.transactionSchema, {
    id: row.id,
    title: row.name,
    type: "withdrawal",
    status: row.status,
    amount: -row.amount,
    date: "2026-11-08T12:00:00Z",
  })
);
treasury.DISBURSEMENT_HISTORY.forEach((row) =>
  accept(s.transactionSchema, {
    id: row.id,
    title: row.type === "principal" ? "Principal release" : "Dividend",
    type: "payout",
    status: row.status,
    amount: row.net,
    date: `${row.scheduledDate}T00:00:00Z`,
  })
);
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
accept(notifications.inboxMessageSchema, {
  id: "broadcast-draft",
  title: growthDefaults.subject,
  message: growthDefaults.body,
  topic: growthDefaults.topic,
  date: "2026-11-08T12:00:00Z",
});
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

const mail = load("lib/mail-preview.ts");
const mailSchemas = load("constant/schemas/admin-mail.ts");
const emailDesk = load("app/admin/(admin)/emails/_data.ts").EMAIL_DESK;
accept(mailSchemas.emailDeskSchema, emailDesk);
assert.equal(mail.birthdaySendOn(2, 29, 2026), "2026-02-28");
assert.equal(mail.birthdaySendOn(2, 29, 2028), "2028-02-29");
assert.equal(mail.nextBirthdaySend(2, 29, "2026-11-08"), "2027-02-28");
assert.equal(mail.emailDecision({ security: false, emailOptIn: false }).status, "skipped");
assert.equal(mail.emailDecision({ security: true, emailOptIn: false }).status, "queued");
assert.equal(mail.emailDecision({ security: false, emailOptIn: true, birthdayAlreadySent: true }).status, "skipped");

const blogSchemas = load("constant/schemas/admin-blog.ts");
const blogDesk = load("app/admin/(admin)/blog/_data.ts").BLOG_DESK;
accept(blogSchemas.blogDeskSchema, blogDesk);
accept(blogSchemas.blogPublishRequestSchema, { role: "editor", status: "published" });
reject(blogSchemas.blogPublishRequestSchema, { role: "media-publicity", status: "published" });

const media = load("lib/media-preview.ts");
const mediaSchemas = load("constant/schemas/admin-media.ts");
accept(mediaSchemas.mediaDeskSchema, load("app/admin/(admin)/media/_data.ts").MEDIA_DESK);
assert.equal(media.inspectMedia("image/jpeg", 5_000_000).ok, true);
assert.equal(media.inspectMedia("image/jpeg", 5_000_001).ok, false);
assert.equal(media.inspectMedia("image/gif", 1000).ok, false);
assert.equal(media.inspectMedia("application/pdf", 10_000_001).ok, false);
console.log("Email, blog and media preview rules passed.");
