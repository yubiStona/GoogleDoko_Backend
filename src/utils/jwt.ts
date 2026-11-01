import jwt, { SignOptions } from "jsonwebtoken";
import { UserRole } from "../entities/user.entity";

export interface JwtPayload {
  userId: number;
  role: UserRole | string;
}

const revokedTokens = new Set<string>();

export const revokeToken = (token: string): void => {
  revokedTokens.add(token);
};

export const isTokenRevoked = (token: string): boolean => {
  return revokedTokens.has(token);
};

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET must be configured in environment variables.");
    }
    return "GoogleDoko_Dev_Secret_Key_2026";
  }
  return secret;
};

export const generateToken = (
  payload: JwtPayload,
  expiresIn: string = process.env.JWT_EXPIRES_IN || "7d"
): string => {
  const options: SignOptions = {
    expiresIn: expiresIn as unknown as NonNullable<SignOptions["expiresIn"]>,
  };
  return jwt.sign(payload, getJwtSecret(), options);
};

export const verifyToken = (
  token: string
): JwtPayload => {
  return jwt.verify(
    token,
    getJwtSecret()
  ) as JwtPayload;
};
