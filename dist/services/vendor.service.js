"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VendorService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const repository_1 = require("../repository");
class VendorService {
    async getVendorProducts(userId) {
        return await repository_1.productRepository.find({
            where: { vendorUserId: userId, active: 1 },
            order: { createdAt: "DESC" },
        });
    }
    async saveVendorProduct(userId, body, paramId, vendorName, vendorLocation) {
        const id = paramId || `PROD-${crypto_1.default.randomUUID()}`;
        const current = await repository_1.productRepository.findOne({
            where: { id },
        });
        if (paramId && !current) {
            throw new Error("PRODUCT_NOT_FOUND");
        }
        if (current && current.vendorUserId !== userId) {
            throw new Error("FORBIDDEN");
        }
        const vendor = await repository_1.vendorRepository.findOne({
            where: { userId },
        });
        const seller = vendorName || vendor?.businessName || "GoogleDoko Vendor";
        const origin = vendorLocation || vendor?.location || "Nepal";
        if (current) {
            current.name = body.name ?? current.name;
            current.category = body.category ?? current.category;
            current.weight = body.weight ?? current.weight;
            current.price = Number(body.price ?? current.price);
            current.stock = Number(body.stock ?? current.stock);
            current.active = body.active !== undefined ? (body.active ? 1 : 0) : current.active;
            current.image = body.image ?? current.image;
            current.description = body.description ?? current.description;
            await repository_1.productRepository.save(current);
        }
        else {
            const newProduct = repository_1.productRepository.create({
                id,
                vendorUserId: userId,
                name: body.name,
                category: body.category,
                weight: body.weight,
                price: Number(body.price),
                stock: Number(body.stock ?? 100),
                active: body.active !== undefined ? (body.active ? 1 : 0) : 1,
                image: body.image || "/src/frontend/assets/images/organic-vegetables.jpg",
                seller,
                origin,
                description: body.description || "",
            });
            await repository_1.productRepository.save(newProduct);
        }
        return { id };
    }
    async deleteVendorProduct(userId, productId) {
        const product = await repository_1.productRepository.findOne({
            where: { id: productId },
        });
        if (!product) {
            throw new Error("PRODUCT_NOT_FOUND");
        }
        if (product.vendorUserId !== userId) {
            throw new Error("FORBIDDEN");
        }
        product.active = 0;
        await repository_1.productRepository.save(product);
    }
    async getVendorOrders(userId) {
        const vendorProducts = await repository_1.productRepository.find({
            where: { vendorUserId: userId },
        });
        const vendorProductIds = new Set(vendorProducts.map((p) => String(p.id)));
        const vendor = await repository_1.vendorRepository.findOne({ where: { userId } });
        const vendorName = vendor?.businessName?.trim().toLowerCase();
        const allOrders = await repository_1.orderRepository.find({
            order: { createdAt: "DESC" },
        });
        const matchingOrders = [];
        for (const order of allOrders) {
            let items = [];
            try {
                items = JSON.parse(order.itemsJson || "[]");
            }
            catch {
                items = [];
            }
            const vendorItems = items.filter((item) => {
                const idMatches = item.productId && vendorProductIds.has(String(item.productId));
                const sellerMatches = vendorName && item.seller && String(item.seller).trim().toLowerCase() === vendorName;
                return idMatches || sellerMatches;
            });
            if (vendorItems.length > 0 || (vendorProducts.length === 0 && allOrders.length > 0)) {
                const itemsToUse = vendorItems.length > 0 ? vendorItems : items;
                const vendorSubtotal = itemsToUse.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 1), 0);
                matchingOrders.push({
                    id: order.id,
                    date: order.date,
                    status: order.status,
                    total: vendorSubtotal || order.total,
                    paymentMethod: order.paymentMethod,
                    paymentStatus: order.paymentStatus,
                    deliveryAddress: order.deliveryAddress,
                    recipientName: order.recipientName,
                    recipientPhone: order.recipientPhone,
                    items: itemsToUse,
                    createdAt: order.createdAt,
                });
            }
        }
        return matchingOrders;
    }
}
exports.VendorService = VendorService;
exports.default = new VendorService();
