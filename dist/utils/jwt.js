"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = exports.isTokenRevoked = exports.revokeToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const revokedTokens = new Set();
const revokeToken = (token) => {
    revokedTokens.add(token);
};
exports.revokeToken = revokeToken;
const isTokenRevoked = (token) => {
    return revokedTokens.has(token);
};
exports.isTokenRevoked = isTokenRevoked;
const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("JWT_SECRET must be configured in environment variables.");
        }
        return "GoogleDoko_Dev_Secret_Key_2026";
    }
    return secret;
};
const generateToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || "7d") => {
    const options = {
        expiresIn: expiresIn,
    };
    return jsonwebtoken_1.default.sign(payload, getJwtSecret(), options);
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    return jsonwebtoken_1.default.verify(token, getJwtSecret());
};
exports.verifyToken = verifyToken;
