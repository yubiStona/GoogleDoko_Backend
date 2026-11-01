import { body } from "express-validator";

/*
|--------------------------------------------------------------------------
| Customer Registration Validation
|--------------------------------------------------------------------------
*/
export const registerValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Please provide a valid email address.")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required.")
    .isLength({ min: 6, max: 100 })
    .withMessage("Password must be between 6 and 100 characters."),

  body().custom((b) => {
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
export const registerVendorValidator = [
  ...registerValidator,
  body().custom((b) => {
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
export const registerAdminValidator = [
  ...registerValidator,
  body().custom((b) => {
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
export const loginValidator = [
  body().custom((b) => {
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
export const forgotPasswordValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Please provide a valid email address."),
];

export const resetPasswordValidator = [
  body("token")
    .trim()
    .notEmpty()
    .withMessage("Verification token is required."),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address."),

  body().custom((b) => {
    const pw = b.newPassword || b.password;
    if (!pw || String(pw).length < 6) {
      throw new Error("New password must be at least 6 characters.");
    }
    return true;
  }),
];

export const changePasswordValidator = [
  body().custom((b) => {
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
export const updateProfileValidator = [
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address."),
];

export const updateShopValidator = [
  body("darkMode")
    .optional()
    .isBoolean()
    .withMessage("darkMode must be a boolean."),
  body("language").optional().isString().trim(),
  body("notifications")
    .optional()
    .isObject()
    .withMessage("notifications must be an object."),
];
