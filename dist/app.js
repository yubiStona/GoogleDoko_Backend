"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const path_1 = __importDefault(require("path"));
const routes_1 = __importDefault(require("./routes"));
const response_helper_1 = require("./helpers/response.helper");
const error_middleware_1 = require("./middleware/error.middleware");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
const defaultAllowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4000",
    "http://127.0.0.1:4000",
    "http://localhost:3000",
];
const envOrigins = (process.env.ALLOWED_ORIGINS ||
    process.env.FRONTEND_URL ||
    process.env.APP_URL ||
    "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envOrigins]));
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
        }
    },
    credentials: true,
}));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({
    extended: true,
    limit: "10mb",
}));
// Static uploads directory with directory listing disabled
app.use("/uploads", express_1.default.static(path_1.default.join(process.cwd(), "uploads"), {
    dotfiles: "ignore",
    index: false,
    maxAge: "7d",
}));
app.get("/api/health", (_req, res) => {
    (0, response_helper_1.sendSuccess)(res, 200, "GoogleDoko API is running.", {
        timestamp: new Date().toISOString(),
        status: "healthy",
    });
});
app.use("/api", routes_1.default);
app.use(error_middleware_1.errorHandler);
exports.default = app;
