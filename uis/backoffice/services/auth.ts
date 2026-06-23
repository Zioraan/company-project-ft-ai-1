import { clearAccessToken, setAccessToken } from "@/lib/auth-token";
import { platformApiRequest } from "@/lib/platform-api-client";
import type {
  AuthUser,
  MessageResponse,
  TokenResponse,
} from "@/types/auth";

export async function login(email: string, password: string): Promise<void> {
  const response = await platformApiRequest<TokenResponse>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
    { public: true },
  );
  setAccessToken(response.access_token);
}

export async function register(
  email: string,
  password: string,
  name?: string,
): Promise<void> {
  const response = await platformApiRequest<TokenResponse>(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify({ email, password, name: name || undefined }),
    },
    { public: true },
  );
  setAccessToken(response.access_token);
}

export async function getCurrentUser(): Promise<AuthUser> {
  return platformApiRequest<AuthUser>("/auth/me");
}

export async function updateProfile(
  userId: string,
  input: { name: string; email: string },
): Promise<AuthUser> {
  return platformApiRequest<AuthUser>(`/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await platformApiRequest<void>(
    "/auth/change-password",
    {
      method: "POST",
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    },
  );
}

export async function forgotPassword(email: string): Promise<MessageResponse> {
  return platformApiRequest<MessageResponse>(
    "/auth/forgot-password",
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
    { public: true },
  );
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<MessageResponse> {
  return platformApiRequest<MessageResponse>(
    "/auth/reset-password",
    {
      method: "POST",
      body: JSON.stringify({ token, new_password: newPassword }),
    },
    { public: true },
  );
}

export function logout(): void {
  clearAccessToken();
}
