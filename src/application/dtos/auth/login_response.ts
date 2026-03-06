export class LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  message?: string; // Optional message, e.g., "Login successful"
}
