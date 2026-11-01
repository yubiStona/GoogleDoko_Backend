"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const product_service_1 = __importDefault(require("../services/product.service"));
const response_helper_1 = require("../helpers/response.helper");
const message_helper_1 = require("../helpers/message.helper");
class ProductController {
    async getAll(req, res) {
        try {
            const category = req.query.category;
            const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
            const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
            const search = req.query.q;
            const sort = req.query.sort;
            const page = req.query.page ? Number(req.query.page) : undefined;
            const limit = req.query.limit ? Number(req.query.limit) : undefined;
            const products = await product_service_1.default.getProducts({
                category,
                minPrice,
                maxPrice,
                search,
                sort,
                page,
                limit,
            });
            (0, response_helper_1.sendSuccess)(res, 200, message_helper_1.messages.product.retrieved, products);
        }
        catch (error) {
            console.error("Get products error:", error);
            (0, response_helper_1.sendError)(res, 500, message_helper_1.messages.common.internalServerError);
        }
    }
    async getPopular(req, res) {
        try {
            const limit = req.query.limit ? Number(req.query.limit) : 8;
            const products = await product_service_1.default.getPopularProducts(limit);
            (0, response_helper_1.sendSuccess)(res, 200, message_helper_1.messages.product.retrieved, products);
        }
        catch (error) {
            console.error("Get popular products error:", error);
            (0, response_helper_1.sendError)(res, 500, message_helper_1.messages.common.internalServerError);
        }
    }
    async getFeatured(req, res) {
        try {
            const limit = req.query.limit ? Number(req.query.limit) : 8;
            const products = await product_service_1.default.getFeaturedProducts(limit);
            (0, response_helper_1.sendSuccess)(res, 200, message_helper_1.messages.product.retrieved, products);
        }
        catch (error) {
            console.error("Get featured products error:", error);
            (0, response_helper_1.sendError)(res, 500, message_helper_1.messages.common.internalServerError);
        }
    }
    async getLatest(req, res) {
        try {
            const limit = req.query.limit ? Number(req.query.limit) : 8;
            const products = await product_service_1.default.getLatestProducts(limit);
            (0, response_helper_1.sendSuccess)(res, 200, message_helper_1.messages.product.retrieved, products);
        }
        catch (error) {
            console.error("Get latest products error:", error);
            (0, response_helper_1.sendError)(res, 500, message_helper_1.messages.common.internalServerError);
        }
    }
    async getOne(req, res) {
        try {
            const product = await product_service_1.default.getProductById(String(req.params.id));
            (0, response_helper_1.sendSuccess)(res, 200, message_helper_1.messages.product.retrievedOne, product);
        }
        catch (error) {
            if (error?.message === "PRODUCT_NOT_FOUND") {
                (0, response_helper_1.sendError)(res, 404, message_helper_1.messages.product.notFound);
                return;
            }
            (0, response_helper_1.sendError)(res, 500, message_helper_1.messages.common.internalServerError);
        }
    }
    async search(req, res) {
        try {
            const q = String(req.query.q || "").trim();
            const cat = String(req.query.category || "").trim();
            const products = await product_service_1.default.searchProducts(q, cat);
            (0, response_helper_1.sendSuccess)(res, 200, message_helper_1.messages.product.retrieved, products);
        }
        catch (error) {
            console.error("Search products error:", error);
            (0, response_helper_1.sendError)(res, 500, message_helper_1.messages.common.internalServerError);
        }
    }
    async create(req, res) {
        try {
            const product = await product_service_1.default.createProduct(req.body, req.user?.id, req.user?.role);
            (0, response_helper_1.sendSuccess)(res, 201, message_helper_1.messages.product.created, product);
        }
        catch (error) {
            if (error?.message === "FORBIDDEN") {
                (0, response_helper_1.sendError)(res, 403, message_helper_1.messages.common.forbidden);
                return;
            }
            console.error("Create product error:", error);
            (0, response_helper_1.sendError)(res, 500, message_helper_1.messages.common.internalServerError);
        }
    }
    async update(req, res) {
        try {
            const product = await product_service_1.default.updateProduct(String(req.params.id), req.body, req.user?.id, req.user?.role);
            (0, response_helper_1.sendSuccess)(res, 200, message_helper_1.messages.product.updated, product);
        }
        catch (error) {
            if (error?.message === "PRODUCT_NOT_FOUND") {
                (0, response_helper_1.sendError)(res, 404, message_helper_1.messages.product.notFound);
                return;
            }
            if (error?.message === "FORBIDDEN") {
                (0, response_helper_1.sendError)(res, 403, message_helper_1.messages.common.forbidden);
                return;
            }
            (0, response_helper_1.sendError)(res, 500, message_helper_1.messages.common.internalServerError);
        }
    }
    async delete(req, res) {
        try {
            await product_service_1.default.deleteProduct(String(req.params.id), req.user?.id, req.user?.role);
            (0, response_helper_1.sendSuccess)(res, 200, message_helper_1.messages.product.deleted);
        }
        catch (error) {
            if (error?.message === "PRODUCT_NOT_FOUND") {
                (0, response_helper_1.sendError)(res, 404, message_helper_1.messages.product.notFound);
                return;
            }
            if (error?.message === "FORBIDDEN") {
                (0, response_helper_1.sendError)(res, 403, message_helper_1.messages.common.forbidden);
                return;
            }
            (0, response_helper_1.sendError)(res, 500, message_helper_1.messages.common.internalServerError);
        }
    }
}
exports.ProductController = ProductController;
exports.default = new ProductController();
