"use client";

import {
  type BusinessDetailsRequest,
  type BusinessLookupRequest,
  type KycAddress,
  type KycState,
  type PayoutRequest,
  type SignatoryRequest,
  businessDetailsRequestSchema,
  businessLookupRequestSchema,
  kycDetailsRequestSchema,
  kycStateSchema,
  ninRequestSchema,
  payoutRequestSchema,
  signatoryRequestSchema,
} from "@/constant/schemas/kyc";
import { type ApiError, api, unwrap } from "@/lib/api-client";
import { hasSession } from "@/lib/auth-tokens";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const kycKeys = { state: ["kyc", "state"] as const };

const schema = kycStateSchema;

const uploadFile = (path: string, file: File) => {
  const form = new FormData();
  form.append("file", file);
  return api.upload(path, form, { method: "PUT", schema }).then(unwrap);
};

export const kycApi = {
  state: () => api.get("kyc", { schema }).then(unwrap),
  verifyNin: (nin: string) => api.post("kyc/nin", { nin }, { bodySchema: ninRequestSchema, schema }).then(unwrap),
  saveDetails: (address: KycAddress) =>
    api.put("kyc/details", { address }, { bodySchema: kycDetailsRequestSchema, schema }).then(unwrap),
  uploadSelfie: (file: File) => uploadFile("kyc/selfie", file),
  uploadUtilityBill: (file: File) => uploadFile("kyc/utility-bill", file),
  uploadAuthorisationLetter: (file: File) => uploadFile("kyc/authorisation-letter", file),
  uploadCompanyLogo: (file: File) => uploadFile("kyc/company-logo", file),
  lookupBusiness: (body: BusinessLookupRequest) =>
    api.post("kyc/business", body, { bodySchema: businessLookupRequestSchema, schema }).then(unwrap),
  saveBusinessDetails: (body: BusinessDetailsRequest) =>
    api.put("kyc/business/details", body, { bodySchema: businessDetailsRequestSchema, schema }).then(unwrap),
  verifySignatory: (body: SignatoryRequest) =>
    api.post("kyc/business/signatory", body, { bodySchema: signatoryRequestSchema, schema }).then(unwrap),
  savePayout: (body: PayoutRequest) =>
    api.put("kyc/business/payout", body, { bodySchema: payoutRequestSchema, schema }).then(unwrap),
  submit: () => api.post("kyc/submit", undefined, { schema }).then(unwrap),
};

export const useKycState = () =>
  useQuery<KycState, ApiError>({ queryKey: kycKeys.state, queryFn: kycApi.state, enabled: hasSession() });

function useKycMutation<T>(mutationFn: (body: T) => Promise<KycState>) {
  const queryClient = useQueryClient();
  return useMutation<KycState, ApiError, T>({
    mutationFn,
    onSuccess: (state) => queryClient.setQueryData(kycKeys.state, state),
  });
}

export const useVerifyNin = () => useKycMutation(kycApi.verifyNin);
export const useSaveKycDetails = () => useKycMutation(kycApi.saveDetails);
export const useUploadSelfie = () => useKycMutation(kycApi.uploadSelfie);
export const useUploadUtilityBill = () => useKycMutation(kycApi.uploadUtilityBill);
export const useUploadAuthorisationLetter = () => useKycMutation(kycApi.uploadAuthorisationLetter);
export const useUploadCompanyLogo = () => useKycMutation(kycApi.uploadCompanyLogo);
export const useLookupBusiness = () => useKycMutation(kycApi.lookupBusiness);
export const useSaveBusinessDetails = () => useKycMutation(kycApi.saveBusinessDetails);
export const useVerifySignatory = () => useKycMutation(kycApi.verifySignatory);
export const useSavePayout = () => useKycMutation(kycApi.savePayout);
export const useSubmitKyc = () => useKycMutation<void>(kycApi.submit);
