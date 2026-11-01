"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const repository_1 = require("../repository");
const user_entity_1 = require("../entities/user.entity");
class AdminService {
    async getOverview() {
        const [usersCount, vendorsCount, pendingVendorsCount, productsCount, ordersCount, paidOrders,] = await Promise.all([
            repository_1.userRepository.count({ where: { role: user_entity_1.UserRole.CUSTOMER } }),
            repository_1.userRepository.count({ where: { role: user_entity_1.UserRole.VENDOR } }),
            repository_1.vendorRepository.count({ where: { status: "under_review" } }),
            repository_1.productRepository.count(),
            repository_1.orderRepository.count(),
            repository_1.orderRepository.find({ where: { paymentStatus: "Paid" } }),
        ]);
        const revenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
        return {
            users: usersCount,
            vendors: vendorsCount,
            pendingVendors: pendingVendorsCount,
            products: productsCount,
            orders: ordersCount,
            revenue,
        };
    }
    async getUsers() {
        return await repository_1.userRepository.find({
            order: { id: "DESC" },
            select: [
                "id",
                "email",
                "phone",
                "role",
                "firstName",
                "lastName",
                "location",
                "rewardPoints",
                "isVerified",
                "createdAt",
            ],
        });
    }
    async getVendors() {
        const vendors = await repository_1.vendorRepository.find({
            order: { createdAt: "DESC" },
        });
        const userIds = vendors.map((v) => v.userId);
        const users = await repository_1.userRepository.findByIds(userIds);
        const userMap = new Map(users.map((u) => [u.id, u]));
        const result = [];
        for (const v of vendors) {
            const u = userMap.get(v.userId);
            const productCount = await repository_1.productRepository.count({
                where: { vendorUserId: v.userId, active: 1 },
            });
            result.push({
                ...v,
                email: u?.email || "",
                phone: u?.phone || "",
                firstName: u?.firstName || "",
                lastName: u?.lastName || "",
                createdAt: u?.createdAt || v.createdAt,
                productCount,
            });
        }
        return result;
    }
    async updateVendorStatus(userId, status) {
        const vendor = await repository_1.vendorRepository.findOne({
            where: { userId },
        });
        if (!vendor) {
            throw new Error("VENDOR_NOT_FOUND");
        }
        vendor.status = status;
        await repository_1.vendorRepository.save(vendor);
        const user = await repository_1.userRepository.findOne({
            where: { id: userId },
        });
        if (user) {
            user.isVerified = status === "approved";
            await repository_1.userRepository.save(user);
        }
        return { ok: true, status };
    }
    async getCoupons() {
        const coupons = await repository_1.couponRepository.find({
            order: { createdAt: "DESC" },
        });
        return coupons.map((c) => ({
            ...c,
            discount_type: c.discountType,
            discount_value: c.discountValue,
            min_order: c.minOrder,
            max_uses: c.maxUses,
            times_used: c.timesUsed,
            expiry_date: c.expiryDate,
            created_at: c.createdAt,
        }));
    }
    async createCoupon(data) {
        const cleanCode = data.code.trim().toUpperCase();
        const existing = await repository_1.couponRepository.findOne({
            where: { code: cleanCode },
        });
        if (existing) {
            throw new Error("COUPON_ALREADY_EXISTS");
        }
        const coupon = repository_1.couponRepository.create({
            code: cleanCode,
            discountType: data.discountType || data.discount_type || "percentage",
            discountValue: Number(data.discountValue ?? data.discount_value ?? 0),
            minOrder: Number(data.minOrder ?? data.min_order ?? 0),
            maxUses: Number(data.maxUses ?? data.max_uses ?? 100),
            expiryDate: data.expiryDate || data.expiry_date || null,
            active: 1,
        });
        return await repository_1.couponRepository.save(coupon);
    }
    async toggleCoupon(id) {
        const coupon = await repository_1.couponRepository.findOne({
            where: { id },
        });
        if (!coupon) {
            throw new Error("COUPON_NOT_FOUND");
        }
        coupon.active = coupon.active === 1 ? 0 : 1;
        return await repository_1.couponRepository.save(coupon);
    }
    async deleteCoupon(id) {
        const coupon = await repository_1.couponRepository.findOne({
            where: { id },
        });
        if (!coupon) {
            throw new Error("COUPON_NOT_FOUND");
        }
        await repository_1.couponRepository.remove(coupon);
    }
    async getSettings() {
        const settings = await repository_1.settingRepository.find();
        const map = {};
        for (const s of settings)
            map[s.key] = s.value;
        return map;
    }
    async updateSettings(newSettings) {
        for (const [key, value] of Object.entries(newSettings)) {
            let setting = await repository_1.settingRepository.findOne({ where: { key } });
            if (setting) {
                setting.value = String(value);
            }
            else {
                setting = repository_1.settingRepository.create({ key, value: String(value) });
            }
            await repository_1.settingRepository.save(setting);
        }
        return await this.getSettings();
    }
    async getAllProducts() {
        return await repository_1.productRepository.find({
            order: { id: "ASC" },
        });
    }
    async saveProduct(idParam, body) {
        const id = idParam || `PROD-${crypto_1.default.randomUUID()}`;
        let product = await repository_1.productRepository.findOne({ where: { id } });
        if (idParam && !product) {
            throw new Error("PRODUCT_NOT_FOUND");
        }
        if (product) {
            Object.assign(product, body);
            return await repository_1.productRepository.save(product);
        }
        else {
            const newProduct = repository_1.productRepository.create({
                ...body,
                id,
            });
            return await repository_1.productRepository.save(newProduct);
        }
    }
    async deleteProduct(id) {
        const product = await repository_1.productRepository.findOne({ where: { id } });
        if (!product) {
            throw new Error("PRODUCT_NOT_FOUND");
        }
        await repository_1.productRepository.remove(product);
    }
    async getAllOrders() {
        const orders = await repository_1.orderRepository.find({
            order: { createdAt: "DESC" },
        });
        return orders.map((o) => {
            let items = [];
            try {
                items = typeof o.itemsJson === "string" ? JSON.parse(o.itemsJson) : (o.itemsJson || []);
            }
            catch {
                items = [];
            }
            return {
                ...o,
                items,
                delivery_address: o.deliveryAddress,
                recipient_name: o.recipientName,
                recipient_phone: o.recipientPhone,
                payment_method: o.paymentMethod,
                payment_status: o.paymentStatus,
                delivery_fee: o.deliveryFee,
            };
        });
    }
    async updateOrderStatus(id, rawStatus, paymentStatus) {
        const order = await repository_1.orderRepository.findOne({ where: { id } });
        if (!order) {
            throw new Error("ORDER_NOT_FOUND");
        }
        const lower = String(rawStatus || "").trim().toLowerCase();
        const map = {
            pending: "Pending",
            processing: "Processing",
            shipped: "Shipped",
            "out for delivery": "Out for Delivery",
            delivered: "Delivered",
            cancelled: "Cancelled",
            canceled: "Cancelled",
        };
        const status = map[lower] || rawStatus;
        order.status = status;
        if (paymentStatus) {
            order.paymentStatus = paymentStatus;
        }
        else if (status === "Delivered") {
            order.paymentStatus = "Paid";
        }
        return await repository_1.orderRepository.save(order);
    }
    async getSupportMessages() {
        return await repository_1.supportMessageRepository.find({
            order: { createdAt: "DESC" },
        });
    }
    async updateSupportStatus(id, status) {
        const msg = await repository_1.supportMessageRepository.findOne({ where: { id } });
        if (!msg) {
            throw new Error("RESOURCE_NOT_FOUND");
        }
        msg.status = status;
        return await repository_1.supportMessageRepository.save(msg);
    }
    async getSubscribers() {
        return await repository_1.subscriberRepository.find({
            order: { createdAt: "DESC" },
        });
    }
}
exports.AdminService = AdminService;
exports.default = new AdminService();
