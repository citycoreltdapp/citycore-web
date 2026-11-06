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
