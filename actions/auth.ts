"use client";

import {
  type AuthSession,
  type AuthUser,
  type ChangePasswordRequest,
  type EmailCodeRequest,
  type EmailRequest,
  type LoginRequest,
  type LoginResponse,
  type RegisterRequest,
  type ResetPasswordRequest,
  type SetPasswordRequest,
  type UpdateProfileRequest,
  authSessionSchema,
  authUserSchema,
  changePasswordRequestSchema,
  emailCodeRequestSchema,
  emailRequestSchema,
  loginRequestSchema,
  loginResponseSchema,
  registerRequestSchema,
  resetPasswordRequestSchema,
  setPasswordRequestSchema,
  updateProfileRequestSchema,
} from "@/constant/schemas/auth";
import { type ApiError, api, unwrap } from "@/lib/api-client";
import { clearSession, hasSession, setSession } from "@/lib/auth-tokens";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const authKeys = { user: ["auth", "user"] as const };

const startSession = (session: AuthSession) => {
  setSession(session.accessToken);
  return session;
};

export const authApi = {
  login: (body: LoginRequest): Promise<LoginResponse> =>
    api
      .post("auth/login", body, { bodySchema: loginRequestSchema, schema: loginResponseSchema })
      .then(unwrap)
      .then((result) => ("accessToken" in result ? startSession(result) : result)),

  verifyLogin: (body: EmailCodeRequest) =>
    api
      .post("auth/login/verify", body, { bodySchema: emailCodeRequestSchema, schema: authSessionSchema })
      .then(unwrap)
      .then(startSession),

  resendLoginCode: (body: EmailRequest) =>
    api.post("auth/login/resend", body, { bodySchema: emailRequestSchema }).then(unwrap),

  register: (body: RegisterRequest) =>
    api
      .post("auth/register", body, { bodySchema: registerRequestSchema, schema: authSessionSchema })
      .then(unwrap)
      .then(startSession),

  requestEmailVerification: (body: EmailRequest) =>
    api.post("auth/verify-email/request", body, { bodySchema: emailRequestSchema }).then(unwrap),

  verifyEmail: (body: EmailCodeRequest) =>
    api
      .post("auth/verify-email", body, { bodySchema: emailCodeRequestSchema, schema: authSessionSchema })
      .then(unwrap)
      .then(startSession),

  forgotPassword: (body: EmailRequest) =>
    api.post("auth/forgot-password", body, { bodySchema: emailRequestSchema }).then(unwrap),

  checkResetCode: (body: EmailCodeRequest) =>
    api.post("auth/reset-password/verify", body, { bodySchema: emailCodeRequestSchema }).then(unwrap),

  resetPassword: (body: ResetPasswordRequest) =>
    api.post("auth/reset-password", body, { bodySchema: resetPasswordRequestSchema }).then(unwrap),

  logout: () => api.post("auth/logout").finally(() => clearSession()),

  me: () => api.get("users/me", { schema: authUserSchema }).then(unwrap),

  changePassword: (body: ChangePasswordRequest) =>
    api
      .post("auth/change-password", body, { bodySchema: changePasswordRequestSchema, schema: authSessionSchema })
      .then(unwrap)
      .then(startSession),

  setPassword: (body: SetPasswordRequest) =>
    api
      .post("auth/set-password", body, { bodySchema: setPasswordRequestSchema, schema: authSessionSchema })
      .then(unwrap)
      .then(startSession),

  updateProfile: (body: UpdateProfileRequest) =>
    api.patch("users/me", body, { bodySchema: updateProfileRequestSchema, schema: authUserSchema }).then(unwrap),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    return api.upload("users/me/avatar", form, { method: "PUT", schema: authUserSchema }).then(unwrap);
  },

  removeAvatar: () => api.delete("users/me/avatar", { schema: authUserSchema }).then(unwrap),
};

export const useCurrentUser = () =>
  useQuery<AuthUser, ApiError>({ queryKey: authKeys.user, queryFn: authApi.me, enabled: hasSession() });

export const initials = (name = "") =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function useSessionMutation<T>(mutationFn: (body: T) => Promise<AuthSession>) {
  const queryClient = useQueryClient();
  return useMutation<AuthSession, ApiError, T>({
    mutationFn,
    onSuccess: ({ user }) => queryClient.setQueryData(authKeys.user, user),
  });
}

function useUserMutation<T>(mutationFn: (body: T) => Promise<AuthUser>) {
  const queryClient = useQueryClient();
  return useMutation<AuthUser, ApiError, T>({
    mutationFn,
    onSuccess: (user) => queryClient.setQueryData(authKeys.user, user),
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation<LoginResponse, ApiError, LoginRequest>({
    mutationFn: authApi.login,
    onSuccess: (result) => {
      if ("user" in result) queryClient.setQueryData(authKeys.user, result.user);
    },
  });
}

export const useVerifyLogin = () => useSessionMutation(authApi.verifyLogin);
export const useResendLoginCode = () =>
  useMutation<unknown, ApiError, EmailRequest>({ mutationFn: authApi.resendLoginCode });
export const useChangePassword = () => useSessionMutation(authApi.changePassword);
export const useSetPassword = () => useSessionMutation(authApi.setPassword);
export const useUpdateProfile = () => useUserMutation(authApi.updateProfile);
export const useUploadAvatar = () => useUserMutation(authApi.uploadAvatar);
export const useRemoveAvatar = () => useUserMutation<void>(authApi.removeAvatar);
export const useRegister = () => useSessionMutation(authApi.register);
export const useVerifyEmail = () => useSessionMutation(authApi.verifyEmail);

export const useRequestEmailVerification = () =>
  useMutation<unknown, ApiError, EmailRequest>({ mutationFn: authApi.requestEmailVerification });
export const useForgotPassword = () =>
  useMutation<unknown, ApiError, EmailRequest>({ mutationFn: authApi.forgotPassword });
export const useCheckResetCode = () =>
  useMutation<unknown, ApiError, EmailCodeRequest>({ mutationFn: authApi.checkResetCode });
export const useResetPassword = () =>
  useMutation<unknown, ApiError, ResetPasswordRequest>({ mutationFn: authApi.resetPassword });

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation<unknown, ApiError, void>({
    mutationFn: authApi.logout,
    // Nothing from this account may show to whoever signs in next.
    onSettled: () => queryClient.clear(),
  });
}

/**
 * Carries the email, and the reset code once checked, between the steps of sign-up and password reset.
 * Kept in sessionStorage rather than the URL, so the address stays out of history and logs.
 */
const FLOW_KEY = "citycore.authFlow";
export const authFlow = {
  get(): { email?: string; code?: string } {
    try {
      return JSON.parse(sessionStorage.getItem(FLOW_KEY) ?? "{}");
    } catch {
      return {};
    }
  },
  set(value: { email: string; code?: string }) {
    try {
      sessionStorage.setItem(FLOW_KEY, JSON.stringify(value));
    } catch {}
  },
  clear() {
    try {
      sessionStorage.removeItem(FLOW_KEY);
    } catch {}
  },
};
