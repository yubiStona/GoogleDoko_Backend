"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const repository_1 = require("../repository");
const order_entity_1 = require("../entities/order.entity");
const product_entity_1 = require("../entities/product.entity");
const user_entity_1 = require("../entities/user.entity");
const cart_entity_1 = require("../entities/cart.entity");
const coupon_entity_1 = require("../entities/coupon.entity");
const reward_log_entity_1 = require("../entities/reward-log.entity");
const database_1 = require("../config/database");
class OrderService {
    async createCheckoutOrder(userId, userRole, body) {
        if (userRole !== "customer") {
            throw new Error("FORBIDDEN");
        }
        if (!Array.isArray(body.items) ||
            body.items.length === 0 ||
            !body.deliveryAddress ||
            !body.recipientName ||
            !body.recipientPhone) {
            throw new Error("VALIDATION_FAILED");
        }
        const validMethods = [
            "Cash on Delivery",
            "eSewa Mobile Wallet",
            "Khalti Wallet",
            "Direct Bank Transfer",
        ];
        const paymentMethod = validMethods.includes(body.paymentMethod || "")
            ? body.paymentMethod
            : "Cash on Delivery";
        // Orders always begin as Pending until server-side gateway verification
        const paymentStatus = "Pending";
        const orderId = body.id || `GD-${crypto_1.default.randomUUID()}`;
        const existingOrder = await repository_1.orderRepository.findOne({
            where: { id: orderId },
        });
        if (existingOrder) {
            if (existingOrder.userId === userId) {
                return {
                    id: orderId,
                    order: existingOrder,
                    orders: await repository_1.orderRepository.find({ where: { userId }, order: { createdAt: "DESC" } }),
                };
            }
            throw new Error("ORDER_ALREADY_EXISTS");
        }
        // Aggregate quantities
        const quantities = new Map();
        for (const item of body.items) {
            const pid = String(item.productId || item.id || "");
            const q = Number(item.quantity);
            if (!Number.isInteger(q) || q < 1) {
                throw new Error("VALIDATION_FAILED");
            }
            quantities.set(pid, (quantities.get(pid) || 0) + q);
        }
        const savedOrder = await database_1.appDataSource.transaction(async (transactionManager) => {
            const txProductRepo = transactionManager.getRepository(product_entity_1.Product);
            const txOrderRepo = transactionManager.getRepository(order_entity_1.Order);
            const txCartRepo = transactionManager.getRepository(cart_entity_1.Cart);
            const txCouponRepo = transactionManager.getRepository(coupon_entity_1.Coupon);
            const txUserRepo = transactionManager.getRepository(user_entity_1.User);
            const txRewardRepo = transactionManager.getRepository(reward_log_entity_1.RewardLog);
            const items = [];
            for (const [productId, quantity] of quantities) {
                const product = await txProductRepo
                    .createQueryBuilder("product")
                    .setLock("pessimistic_write")
                    .where("product.id = :id AND product.active = 1", { id: productId })
                    .getOne();
                if (!product || product.stock < quantity) {
                    throw new Error("INSUFFICIENT_STOCK");
                }
                product.stock -= quantity;
                await txProductRepo.save(product);
                items.push({
                    productId,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    weight: product.weight,
                    quantity,
                    vendorId: product.vendorUserId,
                });
            }
            const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
            // Fetch delivery settings
            const settings = await repository_1.settingRepository.find();
            const settingsMap = {};
            for (const s of settings)
                settingsMap[s.key] = s.value;
            const baseDeliveryFee = Number(settingsMap["delivery_fee"] || 50);
            const freeThreshold = Number(settingsMap["free_delivery_threshold"] || 1500);
            const deliveryFee = subtotal >= freeThreshold ? 0 : baseDeliveryFee;
            let discount = 0;
            if (body.couponCode) {
                const cleanCode = body.couponCode.trim().toUpperCase();
                const coupon = await txCouponRepo.findOne({
                    where: { code: cleanCode, active: 1 },
                });
                if (coupon) {
                    const notExpired = !coupon.expiryDate || new Date(coupon.expiryDate).getTime() >= Date.now();
                    const hasUses = coupon.timesUsed < coupon.maxUses;
                    const meetsMin = subtotal >= coupon.minOrder;
                    if (notExpired && hasUses && meetsMin) {
                        discount =
                            coupon.discountType === "percentage"
                                ? Math.round((subtotal * coupon.discountValue) / 100)
                                : Math.min(subtotal, coupon.discountValue);
                        coupon.timesUsed += 1;
                        await txCouponRepo.save(coupon);
                    }
                }
            }
            const total = Math.max(0, subtotal + deliveryFee - discount);
            const order = txOrderRepo.create({
                id: orderId,
                userId,
                date: new Date().toISOString(),
                status: "Pending",
                subtotal,
                deliveryFee,
                discount,
                total,
                paymentMethod,
                paymentStatus,
                deliveryAddress: body.deliveryAddress,
                recipientName: body.recipientName,
                recipientPhone: body.recipientPhone,
                itemsJson: JSON.stringify(items),
            });
            const createdOrder = await txOrderRepo.save(order);
            // Clear from cart
            if (body.fromCart !== false) {
                for (const item of items) {
                    await txCartRepo.delete({
                        userId,
                        productId: item.productId,
                    });
                }
            }
            // Reward points
            const earnedPts = Math.floor(total / 10) || 0;
            if (earnedPts > 0) {
                const user = await txUserRepo.findOne({ where: { id: userId } });
                if (user) {
                    user.rewardPoints = (user.rewardPoints || 0) + earnedPts;
                    await txUserRepo.save(user);
                    const rewardLog = txRewardRepo.create({
                        userId,
                        label: "Order reward",
                        points: earnedPts,
                    });
                    await txRewardRepo.save(rewardLog);
                }
            }
            return createdOrder;
        });
        const userOrders = await repository_1.orderRepository.find({
            where: { userId },
            order: { createdAt: "DESC" },
        });
        return {
            id: orderId,
            order: savedOrder,
            orders: userOrders,
        };
    }
    async getUserOrders(userId) {
        return await repository_1.orderRepository.find({
            where: { userId },
            order: { createdAt: "DESC" },
        });
    }
    async getOrderById(id, userId, role) {
        const order = await repository_1.orderRepository.findOne({
            where: { id },
        });
        if (!order) {
            throw new Error("ORDER_NOT_FOUND");
        }
        if (role !== "admin" && userId && order.userId !== userId) {
            throw new Error("FORBIDDEN");
        }
        return order;
    }
    async getAllOrders() {
        return await repository_1.orderRepository.find({
            order: { createdAt: "DESC" },
        });
    }
    async updateOrderStatus(id, status, paymentStatus) {
        const order = await repository_1.orderRepository.findOne({
            where: { id },
        });
        if (!order) {
            throw new Error("ORDER_NOT_FOUND");
        }
        // If order was cancelled, restock products
        if (status === "Cancelled" && order.status !== "Cancelled") {
            try {
                const items = JSON.parse(order.itemsJson || "[]");
                for (const item of items) {
                    if (item.productId && item.quantity) {
                        const product = await repository_1.productRepository.findOne({
                            where: { id: item.productId },
                        });
                        if (product) {
                            product.stock += Number(item.quantity);
                            await repository_1.productRepository.save(product);
                        }
                    }
                }
            }
            catch {
                // Continue if items JSON was malformed
            }
        }
        order.status = status;
        if (paymentStatus) {
            order.paymentStatus = paymentStatus;
        }
        else if (status === "Delivered") {
            order.paymentStatus = "Paid";
        }
        return await repository_1.orderRepository.save(order);
    }
    async getOrderTracking(orderId, userId) {
        const order = await this.getOrderById(orderId, userId);
        const status = order.status || "Pending";
        const steps = [
            { step: "Order Placed", date: order.date, status: "complete" },
            {
                step: "Confirmed by Farmer",
                date: status !== "Pending" && status !== "Cancelled" ? order.date : "Pending",
                status: ["Processing", "Shipped", "Delivered"].includes(status)
                    ? "complete"
                    : status === "Pending"
                        ? "current"
                        : "pending",
            },
            {
                step: "Shipped & In Transit",
                date: ["Shipped", "Delivered"].includes(status) ? order.date : "Pending",
                status: ["Shipped", "Delivered"].includes(status)
                    ? "complete"
                    : status === "Processing"
                        ? "current"
                        : "pending",
            },
            {
                step: "Delivered",
                date: status === "Delivered" ? order.date : "Pending",
                status: status === "Delivered" ? "complete" : status === "Shipped" ? "current" : "pending",
            },
        ];
        return {
            orderId: order.id,
            status: order.status,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
            recipientName: order.recipientName,
            deliveryAddress: order.deliveryAddress,
            recipientPhone: order.recipientPhone,
            items: JSON.parse(order.itemsJson || "[]"),
            total: order.total,
            subtotal: order.subtotal,
            deliveryFee: order.deliveryFee,
            discount: order.discount,
            steps,
        };
    }
}
exports.OrderService = OrderService;
exports.default = new OrderService();
