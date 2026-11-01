"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = exports.uploadsDir = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const multer_1 = __importDefault(require("multer"));
exports.uploadsDir = process.env.UPLOADS_DIR || path_1.default.join(process.cwd(), "uploads");
if (!fs_1.default.existsSync(exports.uploadsDir)) {
    fs_1.default.mkdirSync(exports.uploadsDir, { recursive: true });
}
const ALLOWED_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
]);
const ALLOWED_EXTENSIONS = new Set([
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
]);
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, exports.uploadsDir),
    filename: (_req, file, cb) => {
        const rawExt = path_1.default.extname(file.originalname).toLowerCase();
        const ext = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : ".jpg";
        const randomHex = crypto_1.default.randomBytes(16).toString("hex");
        const safeName = `img-${Date.now()}-${randomHex}${ext}`;
        cb(null, safeName);
    },
});
exports.upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
        files: 1,
    },
    fileFilter: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        const isMimeAllowed = ALLOWED_MIME_TYPES.has(file.mimetype);
        const isExtAllowed = ALLOWED_EXTENSIONS.has(ext);
        if (isMimeAllowed && isExtAllowed) {
            cb(null, true);
        }
        else {
            cb(new Error("Invalid file type. Only JPEG, PNG, and WebP images up to 5MB are permitted."));
        }
    },
});
