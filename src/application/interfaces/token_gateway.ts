import { JwtPayload } from 'src/domain/value_objects/jwt_payload';

export interface ITokenGateway {
  generateAccessToken(payload: JwtPayload): string;
  generateRefreshToken(payload: JwtPayload): string;
}
