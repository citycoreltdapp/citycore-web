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
