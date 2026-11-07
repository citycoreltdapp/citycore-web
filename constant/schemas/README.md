# CityCore data contracts

Import public contracts from `@/constant/schema.client`, or import one domain directly from `@/constant/schemas/<domain>` to keep dependencies focused. These are validation contracts, not implemented endpoints. Existing previews and layouts stay intact.

| Page / feature                        | Fetch / response contracts                                                                                                                               | Create / update contracts                                                                                                                                            |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard                             | `dashboardQuerySchema`, `dashboardSummaryResponseSchema`, `dashboardHistoryResponseSchema`, `dashboardTransactionsResponseSchema`                        | No mutation on the overview                                                                                                                                          |
| Marketplace / detail                  | `investmentListQuerySchema`, `investmentListResponseSchema`, `investmentParamsSchema`, `investmentDetailResponseSchema`                                  | `investmentQuoteRequestSchema`, `purchaseInvestmentRequestSchema`                                                                                                    |
| Checkout                              | `investmentQuoteResponseSchema`, `purchaseInvestmentResponseSchema`                                                                                      | `agreementFormSchema` validates UI consent; purchase submits a server quote ID                                                                                       |
| My Investments                        | `holdingListQuerySchema`, `holdingListResponseSchema`, `portfolioSummaryResponseSchema`, `portfolioHistoryQuerySchema`, `portfolioHistoryResponseSchema` | Purchases go through checkout                                                                                                                                        |
| Wallet                                | `walletResponseSchema`, `walletTransfersQuerySchema`, `walletTransfersResponseSchema`                                                                    | `fundingFormSchema`, `createFundingRequestSchema`, `createFundingResponseSchema`                                                                                     |
| Withdrawals / credits                 | `creditListQuerySchema`, `creditListResponseSchema`, `bankAccountsResponseSchema`, `withdrawalListResponseSchema`                                        | `updateCreditRequestSchema`, `withdrawalQuoteRequestSchema`, `createWithdrawalRequestSchema`                                                                         |
| Transactions / reports                | `transactionListQuerySchema`, `transactionListResponseSchema`, `reportQuerySchema`, `transactionReportResponseSchema`                                    | Read-only; format display rows after parsing                                                                                                                         |
| Profile / address / privacy           | `profileResponseSchema`, `addressResponseSchema`, `privacyResponseSchema`                                                                                | `profileSchema`, `addressSchema`, `updateProfileRequestSchema`, `updateAddressRequestSchema`, `updatePrivacyRequestSchema`                                           |
| Profile photo                         | `profilePhotoUploadResponseSchema`                                                                                                                       | `profilePhotoFileSchema` for the local file; `profilePhotoMetadataSchema` to request an upload; `commitProfilePhotoRequestSchema`, `deleteProfilePhotoRequestSchema` |
| Password / 2FA                        | `twoFactorStatusResponseSchema`, `startTwoFactorResponseSchema`, `verifyTwoFactorResponseSchema`                                                         | `passwordSchema` for the form; `changePasswordRequestSchema`, `startTwoFactorRequestSchema`, `verifyTwoFactorRequestSchema`, `disableTwoFactorRequestSchema`         |
| Social connections / deletion         | `socialConnectionsResponseSchema`, `startSocialConnectionResponseSchema`, `deleteAccountResponseSchema`                                                  | `startSocialConnectionRequestSchema`, `deleteAccountFormSchema`, `deleteAccountRequestSchema`, `cancelAccountDeletionRequestSchema`                                  |
| Market Insights                       | `marketInsightsQuerySchema`, `marketInsightsResponseSchema`                                                                                              | Read-only; AI questions use chat contracts                                                                                                                           |
| Investment Explorer / recommendations | `recommendationsResponseSchema`, `recommendationHistoryQuerySchema`, `recommendationHistoryResponseSchema`                                               | `recommendationPreferencesRequestSchema`, `updateRecommendationRequestSchema`, `marketQuestionFormSchema`                                                            |
| Ask AI / floating chat / history      | `conversationListQuerySchema`, `conversationListResponseSchema`, `conversationSchema`, `chatStreamEventSchema`                                           | `sendChatMessageRequestSchema`, `updateConversationRequestSchema`, `chatFeedbackRequestSchema`; IDs use `conversationParamsSchema` / `messageParamsSchema`           |
| Help Center / guides                  | `helpArticlesQuerySchema`, `helpArticlesResponseSchema`, `helpArticleSchema`, `productGuidesResponseSchema`, `helpDownloadResponseSchema`                | Read-only                                                                                                                                                            |
| Admin dashboard                       | `adminDashboardQuerySchema`, `adminDashboardResponseSchema`                                                                                              | Read-only                                                                                                                                                            |
| Auth / onboarding                     | Existing schemas re-exported from `constant/auth.ts` and `constant/onboarding.ts`                                                                        | Existing React Hook Form schemas retained                                                                                                                            |

## Wiring a fetch

```ts
const query = investmentListQuerySchema.parse({ page: "1", pageSize: "12" });
const response = await fetch(
  `/api/investments?${new URLSearchParams({ page: String(query.page), pageSize: String(query.pageSize) })}`
);
if (!response.ok) throw new Error("Unable to load investments");
const data = investmentListResponseSchema.parse(await response.json());
```

The URL above is an example; there is no new API implementation. Parse queries, payloads and responses at their boundaries. Do not cast JSON to a TypeScript type.

## Form input versus API output

Use `z.input<typeof schema>` for editable values and `z.output<typeof schema>` for parsed values. Most forms have identical input/output types. `recommendationPreferencesRequestSchema` deliberately converts budget/horizon strings to numbers and validates the normalized payload. Phone fields hold `{ number, countryCode }`; profile API requests expect an international number or `null`. Password confirmation and browser `File` objects belong to forms, not JSON requests.

```ts
const form = useForm<
  z.input<typeof recommendationPreferencesRequestSchema>,
  unknown,
  z.output<typeof recommendationPreferencesRequestSchema>
>({ resolver: zodResolver(recommendationPreferencesRequestSchema) });
```

The existing profile, address, password and agreement forms consume shared schemas. Funding, recommendation preferences/questions and conversation renaming also use React Hook Form. Chat send/rename validate in the shared store, so full and floating chat use the same boundary. Simple search and filter controls stay controlled inputs.

## Conventions

- Pagination is one-based: `{ page, pageSize }` in; `{ items, page, pageSize, total }` out.
- Monetary values are **major currency units**, finite, at most two decimal places. Currency is explicit where accounts can contain multiple currencies. Display strings in transaction/credit fixture schemas are separate from normalized API amounts.
- Dates are ISO calendar dates; timestamps are ISO datetimes. Date-range queries reject reversed ranges. Optional query booleans accept `"true"` / `"false"`, not JavaScript truthiness.
- Write payloads use strict objects where appropriate, so extra fields such as client-supplied prices or balances fail validation. Server-side authorization, ownership, current balance, quote expiry, fees, availability and idempotency still need enforcement.
- A selected 2FA preference is not a verified enrollment. Enrollment uses a challenge ID and a verification code. Secret setup URIs, codes and passwords must not be logged or persisted in public profile/history responses.
- Authenticated actor IDs, consent times, settlement amounts and deletion deadlines are server-owned. Never accept them from a browser as authoritative.
- Types are inferred from Zod. Page-local `_data.ts` modules re-export compatible type names instead of duplicating interfaces. Settings `_schemas.ts` remains a compatibility re-export.

Run `pnpm check:schemas` for fixture and invalid-input checks, and `pnpm type-check` for all inferred types and form integration.

### Admin account and invoices

`admin-account.ts` covers account transactions and summary, invoice list queries/responses, the invoice form, creation (draft/send intent plus idempotency key) and versioned status updates. Routes are `/account`, `/account/invoices` and `/account/invoices/new` on the admin tenant. The current UI uses validated fixtures and browser-local drafts; email delivery, authoritative invoice totals/status and billing authorization must be supplied by the backend. `rate` is service metadata, not an additional tax calculation.

### Admin people, staff access and KYC

`admin-people.ts` owns investor/staff/case responses, paginated directory queries, account-status requests with typed confirmation, role and permission requests with independent approvers, revocation, KYC reviewer assignment, decisions and override requests. Form types are inferred from the same schemas. Staff credentials/challenge/verification contracts are separate; passwords and codes are never persisted.

Routes on the admin tenant: `/users`, `/users/management?investor=CC-U014`, `/users/access`, `/kyc`, `/kyc/review?investor=CC-U028`. Review forms currently save browser-local preview requests; no account status, role, permission or KYC decision is applied. The backend must authenticate the actor, authorize every action, check case/version conflicts, enforce independent approval and re-verification, return masked data and record evidence access in the audit service. The permission matrix and session policy are illustrative read models, not authorization enforcement.

### Admin investments

`admin-investments.ts` provides offering form, record, list query/response, create/update and status-change contracts. Routes: `/investments`, `/investments/new`, `/investments/[id]` and `/investments/[id]/edit` on the admin tenant. The UI reuses the dashboard's current property cards and detail components. Drafts, custom covers and publication-review requests persist locally; no investor-facing offering is modified.

Amounts use NGN major units. Allocated units are server-owned and cannot be edited; total units cannot fall below existing allocation. Writes carry version and idempotency keys. Upload the image through an authorized asset endpoint and send `coverAssetId` in API writes; `coverPreview` is browser-only and omitted from write contracts. The server must enforce publisher authorization, independent publication approval, document readiness, valid dates and authoritative allocation counts.

### Returns, treasury and banking

`admin-treasury.ts` covers return schedule forms/writes, dividend previews, independent batch requests, principal release, accrual overrides, segregated treasury account reads, withdrawal risk/batch requests, manual ledger adjustments, settlement retries, banking configuration, mapping previews and retry records. Routes: `/returns`, `/withdrawals`, `/platform/banking`. Preview calculations live in `lib/treasury-preview.ts`; amounts are rounded to cents per group. Accrual periods are inclusive; the default capped-month 30/360 preview produces the sample ₦240,000 gross / ₦24,000 tax / ₦216,000 net. Actual/365 is also available. Frequency is schedule metadata, not an automatic posting trigger.

Only local drafts and review requests are saved. Banking secrets are not collected or persisted. The backend must authorize the actor and independent checker, apply the contractual accrual/tax rules, verify funding and duplicates, resolve provider settlement state, preserve original idempotency references and post balanced ledger entries. Operating adjustments exclude investor escrow. Client amounts are previews; server-owned balances, fees, settlement state and existing accruals must be retrieved authoritatively. Approval, bank transfers, live queries, customer linkage and sync remain unavailable until those services are connected.
