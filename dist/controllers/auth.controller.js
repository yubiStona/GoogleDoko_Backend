"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const jwt_1 = require("../utils/jwt");
const auth_service_1 = __importDefault(require("../services/auth.service"));
const response_helper_1 = require("../helpers/response.helper");
const message_helper_1 = require("../helpers/message.helper");
class AuthController {
    /*
    |--------------------------------------------------------------------------
    | Customer Registration
    |--------------------------------------------------------------------------
    */
    async register(req, res) {
        try {
            const result = await auth_service_1.default.register(req.body);
            (0, response_helper_1.sendSuccess)(res, 201, message_helper_1.messages.auth.registrationSuccess, result);
        }
        catch (error) {
            if (error?.message === "ACCOUNT_ALREADY_EXISTS") {
                (0, response_helper_1.sendError)(res, 409, message_helper_1.messages.auth.accountAlreadyExists);
                return;
            }
            (0, response_helper_1.sendError)(res, 500, error?.message || message_helper_1.messages.common.internalServerError);
        }
    }
    /*
    |--------------------------------------------------------------------------
    | Vendor Registration
    |--------------------------------------------------------------------------
    */
    async registerVendor(req, res) {
        try {
            const result = await auth_service_1.default.registerVendor(req.body);
            (0, response_helper_1.sendSuccess)(res, 201, message_helper_1.messages.auth.vendorRegistrationSuccess, result);
        }
        catch (error) {
            if (error?.message === "ACCOUNT_ALREADY_EXISTS") {
                (0, response_helper_1.sendError)(res, 409, message_helper_1.messages.auth.accountAlreadyExists);
                return;
            }
            (0, response_helper_1.sendError)(res, 500, error?.message || message_helper_1.messages.common.internalServerError);
        }
    }
    /*
    |--------------------------------------------------------------------------
    | Admin Registration
    |--------------------------------------------------------------------------
    */
    async registerAdmin(req, res) {
        try {
            const result = await auth_service_1.default.registerAdmin(req.body);
            (0, response_helper_1.sendSuccess)(res, 201, message_helper_1.messages.auth.adminRegistrationSuccess, result);
        }
        catch (error) {
            if (error?.message === "FORBIDDEN") {
                (0, response_helper_1.sendError)(res, 403, "Invalid master security authorization key.");
                return;
            }
            if (error?.message === "ACCOUNT_ALREADY_EXISTS") {
                (0, response_helper_1.sendError)(res, 409, message_helper_1.messages.auth.accountAlreadyExists);
                return;
            }
            (0, response_helper_1.sendError)(res, 500, error?.message || message_helper_1.messages.common.internalServerError);
        }
    }
    /*
    |--------------------------------------------------------------------------
    | Login
    |--------------------------------------------------------------------------
    */
    async login(req, res) {
        try {
            const result = await auth_service_1.default.login(req.body);
            (0, response_helper_1.sendSuccess)(res, 200, message_helper_1.messages.auth.loginSuccess, result);
        }
        catch (error) {
            if (error?.message === "INVALID_CREDENTIALS") {
                (0, response_helper_1.sendError)(res, 401, message_helper_1.messages.auth.invalidCredentials);
                return;
            }
            if (error?.message === "FORBIDDEN") {
                (0, response_helper_1.sendError)(res, 403, "Account role is not authorized for this portal.");
                return;
            }
            (0, response_helper_1.sendError)(res, 500, error?.message || message_helper_1.messages.common.internalServerError);
        }
    }
    /*
    |--------------------------------------------------------------------------
    | Get Current User (Session)
    |--------------------------------------------------------------------------
    */
    async getCurrentUser(req, res) {
        try {
            const userId = req.user.id;
            const user = await auth_service_1.default.getCurrentUser(userId);
            (0, response_helper_1.sendSuccess)(res, 200, message_helper_1.messages.common.success, { user });
        }
        catch (error) {
            if (error?.message === "USER_NOT_FOUND") {
                (0, response_helper_1.sendError)(res, 404, message_helper_1.messages.auth.userNotFound);
                return;
            }
            (0, response_helper_1.sendError)(res, 500, message_helper_1.messages.common.internalServerError);
        }
    }
    async getMe(req, res) {
        try {
            const userId = req.user.id;
            const session = await auth_service_1.default.buildSessionResponse(userId);
            (0, response_helper_1.sendSuccess)(res, 200, message_helper_1.messages.common.success, session);
        }
        catch (error) {
            if (error?.message === "USER_NOT_FOUND") {
                (0, response_helper_1.sendError)(res, 404, message_helper_1.messages.auth.userNotFound);
                return;
            }
            (0, response_helper_1.sendError)(res, 500, message_helper_1.messages.common.internalServerError);
        }
    }
    /*
    |--------------------------------------------------------------------------
    | Forgot & Reset Password
    |--------------------------------------------------------------------------
    */
    async forgotPassword(req, res) {
        try {
            const result = await auth_service_1.default.forgotPassword(req.body?.email);
            (0, response_helper_1.sendSuccess)(res, 200, message_helper_1.messages.auth.passwordResetSent, result);
        }
        catch (error) {
            (0, response_helper_1.sendError)(res, 500, message_helper_1.messages.common.internalServerError);
        }
    }
    async resetPassword(req, res) {
        try {
            const { email, token, newPassword, password } = req.body || {};
            await auth_service_1.default.resetPassword(email, token, newPassword || password);
            (0, response_helper_1.sendSuccess)(res, 200, message_helper_1.messages.auth.passwordResetSuccess);
        }
        catch (error) {
            if (error?.message === "INVALID_RESET_TOKEN") {
                (0, response_helper_1.sendError)(res, 400, message_helper_1.messages.auth.invalidResetToken);
                return;
            }
            (0, response_helper_1.sendError)(res, 500, message_helper_1.messages.common.internalServerError);
        }
    }
    /*
    |--------------------------------------------------------------------------
    | Change Password
    |--------------------------------------------------------------------------
    */
    async changePassword(req, res) {
        try {
            const userId = req.user.id;
            const current = req.body?.currentPassword || req.body?.current;
            const next = req.body?.newPassword || req.body?.next;
            await auth_service_1.default.changePassword(userId, current, next);
            (0, response_helper_1.sendSuccess)(res, 200, message_helper_1.messages.auth.passwordChangeSuccess);
        }
        catch (error) {
            if (error?.message === "CURRENT_PASSWORD_INCORRECT") {
                (0, response_helper_1.sendError)(res, 400, message_helper_1.messages.auth.currentPasswordIncorrect);
                return;
            }
            (0, response_helper_1.sendError)(res, 500, message_helper_1.messages.common.internalServerError);
        }
    }
    /*
    |--------------------------------------------------------------------------
    | Profile Updates
    |--------------------------------------------------------------------------
    */
    async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const user = await auth_service_1.default.updateProfile(userId, req.body || {});
            (0, response_helper_1.sendSuccess)(res, 200, message_helper_1.messages.auth.profileUpdated, { user });
        }
        catch (error) {
            (0, response_helper_1.sendError)(res, 500, message_helper_1.messages.common.internalServerError);
        }
    }
    async updateShop(req, res) {
        try {
            const userId = req.user.id;
            const user = await auth_service_1.default.updateShopSettings(userId, req.body || {});
            (0, response_helper_1.sendSuccess)(res, 200, message_helper_1.messages.auth.shopUpdated, { user });
        }
        catch (error) {
            (0, response_helper_1.sendError)(res, 500, message_helper_1.messages.common.internalServerError);
        }
    }
    async uploadProfilePhoto(req, res) {
        try {
            const userId = req.user.id;
            if (!req.file) {
                (0, response_helper_1.sendError)(res, 400, message_helper_1.messages.upload.noFile);
                return;
            }
            const photoUrl = `/uploads/${req.file.filename}`;
            const user = await auth_service_1.default.uploadProfilePhoto(userId, photoUrl);
            (0, response_helper_1.sendSuccess)(res, 200, message_helper_1.messages.auth.photoUpdated, { photo: photoUrl, user });
        }
        catch (error) {
            (0, response_helper_1.sendError)(res, 500, message_helper_1.messages.common.internalServerError);
        }
    }
    /*
    |--------------------------------------------------------------------------
    | Logout
    |--------------------------------------------------------------------------
    */
    async logout(req, res) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            if (token) {
                (0, jwt_1.revokeToken)(token);
            }
        }
        (0, response_helper_1.sendSuccess)(res, 200, message_helper_1.messages.auth.logoutSuccess);
    }
}
exports.AuthController = AuthController;
exports.default = new AuthController();
