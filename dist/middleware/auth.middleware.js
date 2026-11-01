"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthenticate = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const response_helper_1 = require("../helpers/response.helper");
const message_helper_1 = require("../helpers/message.helper");
const authenticate = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization ||
        !authorization.startsWith("Bearer")) {
        (0, response_helper_1.sendError)(res, 401, message_helper_1.messages.auth.authenticationRequired);
        return;
    }
    const token = authorization.split(" ")[1];
    if (!token || (0, jwt_1.isTokenRevoked)(token)) {
        (0, response_helper_1.sendError)(res, 401, message_helper_1.messages.auth.authenticationRequired);
        return;
    }
    try {
        const payload = (0, jwt_1.verifyToken)(token);
        const userId = payload.userId || payload.id;
        if (!userId) {
            (0, response_helper_1.sendError)(res, 401, message_helper_1.messages.auth.authenticationRequired);
            return;
        }
        req.user = {
            id: Number(userId),
            role: payload.role,
        };
        next();
    }
    catch {
        (0, response_helper_1.sendError)(res, 401, message_helper_1.messages.auth.authenticationRequired);
    }
};
exports.authenticate = authenticate;
const optionalAuthenticate = (req, _res, next) => {
    const authorization = req.headers.authorization;
    if (authorization && authorization.startsWith("Bearer")) {
        const token = authorization.split(" ")[1];
        if (token) {
            try {
                const payload = (0, jwt_1.verifyToken)(token);
                req.user = {
                    id: payload.userId,
                    role: payload.role,
                };
            }
            catch {
                // Ignore token errors for optional authentication
            }
        }
    }
    next();
};
exports.optionalAuthenticate = optionalAuthenticate;
