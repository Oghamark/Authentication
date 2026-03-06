export class RefreshTokenResponse {
  accessToken: string; // New access token issued
  refreshToken: string; // New refresh token issued
  expiresAt: Date; // Expiration date of the new access token
}
