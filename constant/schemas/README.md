# CityCore data contracts

Import public contracts from `@/constant/schema.client`, or import one domain directly from `@/constant/schemas/<domain>` to keep dependencies focused. These are validation contracts, not implemented endpoints. Existing previews and layouts stay intact.

## Mobile parity

The investor contracts mirror the Flutter app (`citycorerunner_app/lib`) field for field, so web and mobile hit the same endpoints with the same payloads:

- **Wire format is snake_case**, exactly what the app's `fromJson` factories read. Schemas, types and UI use the camelCase names of the Dart fields. Convert only at the boundary with `fromApi(schema, json)` and `toApi(schema, payload)` from `lib/api.ts`.
- **Endpoints** live in `API_ROUTES` (`lib/api.ts`), copied from the app's `AppConstants`. List endpoints return plain arrays, not pages.
- **Enum values are the Dart enum names** and are sent as-is: `fundingSoon`, `fullyFunded`, `mixedUse`, `notStarted`, `actionRequired`, `oneMonth`.
- **Web-only fields are optional additions.** A mobile body always validates. These extra fields are: `agreementVersion`, `signatureName`, `authenticatorCode`, `idempotencyKey` and property `documents`.

| Mobile model (Dart)                           | Web schema                                                                                     | Endpoint                                                      |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `HomeDashboard`, `KycStatus`, `ChartRange`    | `homeDashboardSchema`, `kycStatusSchema`, `chartRangeSchema`                                   | `GET /dashboard`                                              |
| `Property`, `ReferralPlan`                    | `propertySchema`, `propertyListResponseSchema`                                                 | `GET /properties`, `GET /properties/{id}`                     |
| `invest(id, units, pin)`, `InvestmentReceipt` | `investRequestSchema`, `investmentReceiptSchema`                                               | `POST /properties/{id}/invest`                                |
| `Holding`, `PortfolioSummary`                 | `holdingSchema`, `holdingListResponseSchema`, `portfolioSummarySchema` (derived on the client) | `GET /portfolio/holdings`, `GET /portfolio/holdings/{id}`     |
| `WalletInfo`, `BankAccount`                   | `walletSchema`, `bankAccountSchema`                                                            | `GET /wallet`                                                 |
| `Transaction`                                 | `transactionSchema`, `transactionListResponseSchema`                                           | `GET /wallet/transactions`                                    |
| `withdraw(amount, pin)`                       | `withdrawRequestSchema` (minimum ₦1,000, free)                                                 | `POST /wallet/withdraw`                                       |
| `fundWithCard(amount)`                        | `fundWithCardRequestSchema` (minimum ₦1,000)                                                   | `POST /wallet/fund/card`                                      |
| `savePayoutAccount(account, pin)`             | `savePayoutAccountRequestSchema`                                                               | Mock only in the app; `API_ROUTES.payoutAccount`              |
| `NinIdentity`, KYC form                       | `ninIdentitySchema`, `identitySchema`, `kycSubmissionRequestSchema` (web-only)                 | Mock only in the app; `API_ROUTES.ninLookup`, `kycSubmission` |
| `InboxMessage`, `NotificationTopic`           | `inboxMessageSchema`, `notificationPreferencesSchema` (`constant/notifications.ts`)            | Mock only in the app; `API_ROUTES.notifications`              |
| Referral models                               | `referralDashboardResponseSchema`, `referralPlanSchema`                                        | Mock only in the app; `API_ROUTES.referrals`                  |

The app's getters are mirrored as plain functions next to the fixtures:

- **Property:** `unitsLeft`, `fundedFraction`, `canInvest`, `returnFor`
- **Holding:** `expectedReturn`, `accruedYield`, `progress`, `monthsElapsed`, `portfolioSummary`. These take an `asOf` date so prerendered pages never read the clock.
- **Transaction:** `transactionReference`, `isCredit`
- **Bank account:** `maskedAccount`
- **Dashboard:** `totalBalance`

Holding state is `active | matured`. The web has no separate "pending" holding.

Removed in favour of the mobile shapes:

- `investmentSchema`
- the quote and purchase schemas
- `holdingListQuerySchema`
- `creditRowSchema` and the other credit schemas
- `transactionRowSchema`
- `walletTransfersResponseSchema`
- `bankAccountsResponseSchema`
- `dashboardSummaryResponseSchema` and the other dashboard schemas

Admin publication state is `publicationStatus` (`draft | active | paused | pending-review`). It is separate from the property's funding `status`.

| Page / feature                        | Fetch / response contracts                                                                                                                  | Create / update contracts                                                                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard                             | `homeDashboardSchema`                                                                                                                       | No mutation on the overview                                                                                                                                          |
| Marketplace / detail                  | `propertyListResponseSchema`, `propertyParamsSchema`, `propertySchema`                                                                      | Filters run on the client, as in the app                                                                                                                             |
| Checkout                              | `investmentReceiptSchema`                                                                                                                   | `agreementFormSchema` for consent and PIN; `investRequestSchema` is the request body                                                                                 |
| My Investments                        | `holdingListResponseSchema`, `holdingSchema`; `portfolioSummarySchema` is derived                                                           | Purchases go through checkout                                                                                                                                        |
| Wallet                                | `walletSchema`, `transactionListResponseSchema`                                                                                             | `fundingFormSchema` for the form; `fundWithCardRequestSchema`, `savePayoutAccountRequestSchema`                                                                      |
| Withdrawals                           | `walletSchema` (payout account and balance), `transactionListResponseSchema` filtered to withdrawals                                        | `withdrawalSchema(balance)` for the form (`constant/withdrawal.ts`); `withdrawRequestSchema` is the request body                                                     |
| Referrals                             | `referralDashboardResponseSchema`, `resolveReferralCodeResponseSchema`; `propertySchema.referralPlan` is the package's `referralPlanSchema` | `resolveReferralCodeRequestSchema` at sign-up (the `referrer` field)                                                                                                 |
| Transactions                          | `transactionListResponseSchema`                                                                                                             | Read-only; type filter, search and In/Out totals run on the client, as in the app                                                                                    |
| Profile / address / privacy           | `profileResponseSchema`, `addressResponseSchema`, `privacyResponseSchema`                                                                   | `profileSchema`, `addressSchema`, `updateProfileRequestSchema`, `updateAddressRequestSchema`, `updatePrivacyRequestSchema`                                           |
| Profile photo                         | `profilePhotoUploadResponseSchema`                                                                                                          | `profilePhotoFileSchema` for the local file; `profilePhotoMetadataSchema` to request an upload; `commitProfilePhotoRequestSchema`, `deleteProfilePhotoRequestSchema` |
| Password / 2FA                        | `twoFactorStatusResponseSchema`, `startTwoFactorResponseSchema`, `verifyTwoFactorResponseSchema`                                            | `passwordSchema` for the form; `changePasswordRequestSchema`, `startTwoFactorRequestSchema`, `verifyTwoFactorRequestSchema`, `disableTwoFactorRequestSchema`         |
| Social connections / deletion         | `socialConnectionsResponseSchema`, `startSocialConnectionResponseSchema`, `deleteAccountResponseSchema`                                     | `startSocialConnectionRequestSchema`, `deleteAccountFormSchema`, `deleteAccountRequestSchema`, `cancelAccountDeletionRequestSchema`                                  |
| Market Insights                       | `marketInsightsQuerySchema`, `marketInsightsResponseSchema`                                                                                 | Read-only; AI questions use chat contracts                                                                                                                           |
| Investment Explorer / recommendations | `recommendationsResponseSchema`, `recommendationHistoryQuerySchema`, `recommendationHistoryResponseSchema`                                  | `recommendationPreferencesRequestSchema`, `updateRecommendationRequestSchema`, `marketQuestionFormSchema`                                                            |
| Ask AI / floating chat / history      | `conversationListQuerySchema`, `conversationListResponseSchema`, `conversationSchema`, `chatStreamEventSchema`                              | `sendChatMessageRequestSchema`, `updateConversationRequestSchema`, `chatFeedbackRequestSchema`; IDs use `conversationParamsSchema` / `messageParamsSchema`           |
| Help Center / guides                  | `helpArticlesQuerySchema`, `helpArticlesResponseSchema`, `helpArticleSchema`, `productGuidesResponseSchema`, `helpDownloadResponseSchema`   | Read-only                                                                                                                                                            |
| Notifications                         | `inboxResponseSchema` (`constant/notifications.ts`)                                                                                         | `notificationPreferencesSchema`; read state stays on the device, as in the app                                                                                       |
| Admin dashboard                       | `adminDashboardQuerySchema`, `adminDashboardResponseSchema`                                                                                 | Read-only                                                                                                                                                            |
| Auth / onboarding / KYC               | `ninIdentitySchema`, `kycStatusSchema` (`constant/onboarding.ts`); auth schemas from `constant/auth.ts`                                     | `ninLookupRequestSchema`, `onboardingSchema` for the form, `kycSubmissionRequestSchema`                                                                              |

## Wiring a fetch

```ts
import { API_ROUTES, fromApi, toApi } from "@/lib/api";

const response = await fetch(`${API_BASE}${API_ROUTES.properties}`);
if (!response.ok) throw new Error("Unable to load properties");
const properties = fromApi(propertyListResponseSchema, await response.json());

await fetch(`${API_BASE}${API_ROUTES.invest(property.id)}`, {
  method: "POST",
  body: JSON.stringify(toApi(investRequestSchema, { units, pin, idempotencyKey })),
});
```

`API_BASE` is yours to configure; there is no API implementation in this repo. Parse queries, payloads and responses at their boundaries. Never cast JSON to a TypeScript type, and never log a body that holds a PIN.

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

- Investor list endpoints return plain arrays, like the app. Admin lists stay paginated and one-based: `{ page, pageSize }` in; `{ items, page, pageSize, total }` out.
- Monetary values are **major currency units**, finite, at most two decimal places. Currency is explicit where accounts can contain multiple currencies. Transaction amounts are signed: credits positive, debits negative.
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

Amounts use NGN major units. Units sold (`unitsSold`) are server-owned and cannot be edited; total units cannot fall below units sold. Writes carry version and idempotency keys. Upload the image through an authorized asset endpoint and send `coverAssetId` in API writes; `coverPreview` is browser-only and omitted from write contracts. The server must enforce publisher authorization, independent publication approval, document readiness, valid dates and authoritative allocation counts.

### Returns, treasury and banking

`admin-treasury.ts` covers return schedule forms/writes, dividend previews, independent batch requests, principal release, accrual overrides, segregated treasury account reads, withdrawal risk/batch requests, manual ledger adjustments, settlement retries, banking configuration, mapping previews and retry records. Routes: `/returns`, `/withdrawals`, `/platform/banking`. Preview calculations live in `lib/treasury-preview.ts`; amounts are rounded to cents per group. Accrual periods are inclusive; the default capped-month 30/360 preview produces the sample ₦240,000 gross / ₦24,000 tax / ₦216,000 net. Actual/365 is also available. Frequency is schedule metadata, not an automatic posting trigger.

Only local drafts and review requests are saved. Banking secrets are not collected or persisted. The backend must authorize the actor and independent checker, apply the contractual accrual/tax rules, verify funding and duplicates, resolve provider settlement state, preserve original idempotency references and post balanced ledger entries. Operating adjustments exclude investor escrow. Client amounts are previews; server-owned balances, fees, settlement state and existing accruals must be retrieved authoritatively. Approval, bank transfers, live queries, customer linkage and sync remain unavailable until those services are connected.
