import { Request, Response } from "express";

import { revokeToken } from "../utils/jwt";
import authService from "../services/auth.service";
import { sendSuccess, sendError } from "../helpers/response.helper";
import { messages } from "../helpers/message.helper";

export class AuthController {
  /*
  |--------------------------------------------------------------------------
  | Customer Registration
  |--------------------------------------------------------------------------
  */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.register(req.body);
      sendSuccess(res, 201, messages.auth.registrationSuccess, result);
    } catch (error: any) {
      if (error?.message === "ACCOUNT_ALREADY_EXISTS") {
        sendError(res, 409, messages.auth.accountAlreadyExists);
        return;
      }
      sendError(res, 500, error?.message || messages.common.internalServerError);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Vendor Registration
  |--------------------------------------------------------------------------
  */
  async registerVendor(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.registerVendor(req.body);
      sendSuccess(res, 201, messages.auth.vendorRegistrationSuccess, result);
    } catch (error: any) {
      if (error?.message === "ACCOUNT_ALREADY_EXISTS") {
        sendError(res, 409, messages.auth.accountAlreadyExists);
        return;
      }
      sendError(res, 500, error?.message || messages.common.internalServerError);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Admin Registration
  |--------------------------------------------------------------------------
  */
  async registerAdmin(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.registerAdmin(req.body);
      sendSuccess(res, 201, messages.auth.adminRegistrationSuccess, result);
    } catch (error: any) {
      if (error?.message === "FORBIDDEN") {
        sendError(res, 403, "Invalid master security authorization key.");
        return;
      }
      if (error?.message === "ACCOUNT_ALREADY_EXISTS") {
        sendError(res, 409, messages.auth.accountAlreadyExists);
        return;
      }
      sendError(res, 500, error?.message || messages.common.internalServerError);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Login
  |--------------------------------------------------------------------------
  */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.login(req.body);
      sendSuccess(res, 200, messages.auth.loginSuccess, result);
    } catch (error: any) {
      if (error?.message === "INVALID_CREDENTIALS") {
        sendError(res, 401, messages.auth.invalidCredentials);
        return;
      }
      if (error?.message === "FORBIDDEN") {
        sendError(res, 403, "Account role is not authorized for this portal.");
        return;
      }
      sendError(res, 500, error?.message || messages.common.internalServerError);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Get Current User (Session)
  |--------------------------------------------------------------------------
  */
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const user = await authService.getCurrentUser(userId);
      sendSuccess(res, 200, messages.common.success, { user });
    } catch (error: any) {
      if (error?.message === "USER_NOT_FOUND") {
        sendError(res, 404, messages.auth.userNotFound);
        return;
      }
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async getMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const session = await authService.buildSessionResponse(userId);
      sendSuccess(res, 200, messages.common.success, session);
    } catch (error: any) {
      if (error?.message === "USER_NOT_FOUND") {
        sendError(res, 404, messages.auth.userNotFound);
        return;
      }
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Forgot & Reset Password
  |--------------------------------------------------------------------------
  */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.forgotPassword(req.body?.email);
      sendSuccess(res, 200, messages.auth.passwordResetSent, result);
    } catch (error: any) {
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, token, newPassword, password } = req.body || {};
      await authService.resetPassword(email, token, newPassword || password);
      sendSuccess(res, 200, messages.auth.passwordResetSuccess);
    } catch (error: any) {
      if (error?.message === "INVALID_RESET_TOKEN") {
        sendError(res, 400, messages.auth.invalidResetToken);
        return;
      }
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Change Password
  |--------------------------------------------------------------------------
  */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const current = req.body?.currentPassword || req.body?.current;
      const next = req.body?.newPassword || req.body?.next;
      await authService.changePassword(userId, current, next);
      sendSuccess(res, 200, messages.auth.passwordChangeSuccess);
    } catch (error: any) {
      if (error?.message === "CURRENT_PASSWORD_INCORRECT") {
        sendError(res, 400, messages.auth.currentPasswordIncorrect);
        return;
      }
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Profile Updates
  |--------------------------------------------------------------------------
  */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const user = await authService.updateProfile(userId, req.body || {});
      sendSuccess(res, 200, messages.auth.profileUpdated, { user });
    } catch (error: any) {
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async updateShop(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const user = await authService.updateShopSettings(userId, req.body || {});
      sendSuccess(res, 200, messages.auth.shopUpdated, { user });
    } catch (error: any) {
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async uploadProfilePhoto(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      if (!req.file) {
        sendError(res, 400, messages.upload.noFile);
        return;
      }
      const photoUrl = `/uploads/${req.file.filename}`;
      const user = await authService.uploadProfilePhoto(userId, photoUrl);
      sendSuccess(res, 200, messages.auth.photoUpdated, { photo: photoUrl, user });
    } catch (error: any) {
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Logout
  |--------------------------------------------------------------------------
  */
  async logout(req: Request, res: Response): Promise<void> {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      if (token) {
        revokeToken(token);
      }
    }
    sendSuccess(res, 200, messages.auth.logoutSuccess);
  }
}

export default new AuthController();
