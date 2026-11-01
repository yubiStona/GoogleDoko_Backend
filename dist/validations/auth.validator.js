"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateShopValidator = exports.updateProfileValidator = exports.changePasswordValidator = exports.resetPasswordValidator = exports.forgotPasswordValidator = exports.loginValidator = exports.registerAdminValidator = exports.registerVendorValidator = exports.registerValidator = void 0;
const express_validator_1 = require("express-validator");
/*
|--------------------------------------------------------------------------
| Customer Registration Validation
|--------------------------------------------------------------------------
*/
exports.registerValidator = [
    (0, express_validator_1.body)("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required.")
        .isEmail()
        .withMessage("Please provide a valid email address.")
        .normalizeEmail(),
    (0, express_validator_1.body)("password")
        .notEmpty()
        .withMessage("Password is required.")
        .isLength({ min: 6, max: 100 })
        .withMessage("Password must be between 6 and 100 characters."),
    (0, express_validator_1.body)().custom((b) => {
        if (!b.firstName && !b.fullName) {
            throw new Error("First name or full name is required.");
        }
        return true;
    }),
];
/*
|--------------------------------------------------------------------------
| Vendor Registration Validation
|--------------------------------------------------------------------------
*/
exports.registerVendorValidator = [
    ...exports.registerValidator,
    (0, express_validator_1.body)().custom((b) => {
        const biz = b.businessName || b.shopName || b.vendor?.businessName || b.vendor?.shopName;
        if (!biz || !String(biz).trim()) {
            throw new Error("Business or Farm name is required for vendor registration.");
        }
        return true;
    }),
];
/*
|--------------------------------------------------------------------------
| Admin Registration Validation
|--------------------------------------------------------------------------
*/
exports.registerAdminValidator = [
    ...exports.registerValidator,
    (0, express_validator_1.body)().custom((b) => {
        const key = b.adminInviteKey || b.securityKey;
        if (!key || !String(key).trim()) {
            throw new Error("Master security key is required for admin onboarding.");
        }
        return true;
    }),
];
/*
|--------------------------------------------------------------------------
| Login Validation
|--------------------------------------------------------------------------
*/
exports.loginValidator = [
    (0, express_validator_1.body)().custom((b) => {
        const identifier = b.identifier || b.email || b.phone;
        if (!identifier || !String(identifier).trim()) {
            throw new Error("Email or phone number is required.");
        }
        if (!b.password || !String(b.password).trim()) {
            throw new Error("Password is required.");
        }
        return true;
    }),
];
/*
|--------------------------------------------------------------------------
| Password Reset Validation
|--------------------------------------------------------------------------
*/
exports.forgotPasswordValidator = [
    (0, express_validator_1.body)("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required.")
        .isEmail()
        .withMessage("Please provide a valid email address."),
];
exports.resetPasswordValidator = [
    (0, express_validator_1.body)("token")
        .trim()
        .notEmpty()
        .withMessage("Verification token is required."),
    (0, express_validator_1.body)("email")
        .optional()
        .trim()
        .isEmail()
        .withMessage("Please provide a valid email address."),
    (0, express_validator_1.body)().custom((b) => {
        const pw = b.newPassword || b.password;
        if (!pw || String(pw).length < 6) {
            throw new Error("New password must be at least 6 characters.");
        }
        return true;
    }),
];
exports.changePasswordValidator = [
    (0, express_validator_1.body)().custom((b) => {
        const current = b.currentPassword || b.current;
        const next = b.newPassword || b.next;
        if (!current || !String(current).trim()) {
            throw new Error("Current password is required.");
        }
        if (!next || String(next).length < 6) {
            throw new Error("New password must be at least 6 characters.");
        }
        return true;
    }),
];
/*
|--------------------------------------------------------------------------
| Profile & Shop Preferences Validation
|--------------------------------------------------------------------------
*/
exports.updateProfileValidator = [
    (0, express_validator_1.body)("email")
        .optional()
        .trim()
        .isEmail()
        .withMessage("Please provide a valid email address."),
];
exports.updateShopValidator = [
    (0, express_validator_1.body)("darkMode")
        .optional()
        .isBoolean()
        .withMessage("darkMode must be a boolean."),
    (0, express_validator_1.body)("language").optional().isString().trim(),
    (0, express_validator_1.body)("notifications")
        .optional()
        .isObject()
        .withMessage("notifications must be an object."),
];
