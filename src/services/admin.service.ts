import crypto from "crypto";

import {
  userRepository,
  vendorRepository,
  productRepository,
  orderRepository,
  couponRepository,
  settingRepository,
  supportMessageRepository,
  subscriberRepository,
} from "../repository";

import { User, UserRole } from "../entities/user.entity";
import { Vendor } from "../entities/vendor.entity";
import { Product } from "../entities/product.entity";
import { Order } from "../entities/order.entity";
import { Coupon } from "../entities/coupon.entity";
import { PlatformSetting } from "../entities/setting.entity";
import { SupportMessage } from "../entities/support.entity";
import { Subscriber } from "../entities/support.entity";

export class AdminService {
  async getOverview() {
    const [
      usersCount,
      vendorsCount,
      pendingVendorsCount,
      productsCount,
      ordersCount,
      paidOrders,
    ] = await Promise.all([
      userRepository.count({ where: { role: UserRole.CUSTOMER } }),
      userRepository.count({ where: { role: UserRole.VENDOR } }),
      vendorRepository.count({ where: { status: "under_review" } }),
      productRepository.count(),
      orderRepository.count(),
      orderRepository.find({ where: { paymentStatus: "Paid" } }),
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

  async getUsers(): Promise<User[]> {
    return await userRepository.find({
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

  async getVendors(): Promise<any[]> {
    const vendors = await vendorRepository.find({
      order: { createdAt: "DESC" },
    });

    const userIds = vendors.map((v) => v.userId);
    const users = await userRepository.findByIds(userIds);
    const userMap = new Map(users.map((u) => [u.id, u]));

    const result = [];
    for (const v of vendors) {
      const u = userMap.get(v.userId);
      const productCount = await productRepository.count({
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

  async updateVendorStatus(
    userId: number,
    status: string
  ): Promise<{ ok: boolean; status: string }> {
    const vendor = await vendorRepository.findOne({
      where: { userId },
    });

    if (!vendor) {
      throw new Error("VENDOR_NOT_FOUND");
    }

    vendor.status = status;
    await vendorRepository.save(vendor);

    const user = await userRepository.findOne({
      where: { id: userId },
    });

    if (user) {
      user.isVerified = status === "approved";
      await userRepository.save(user);
    }

    return { ok: true, status };
  }

  async getCoupons(): Promise<any[]> {
    const coupons = await couponRepository.find({
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

  async createCoupon(data: {
    code: string;
    discount_type?: "percentage" | "fixed";
    discountType?: "percentage" | "fixed";
    discount_value?: number;
    discountValue?: number;
    min_order?: number;
    minOrder?: number;
    max_uses?: number;
    maxUses?: number;
    expiry_date?: string;
    expiryDate?: string;
  }): Promise<Coupon> {
    const cleanCode = data.code.trim().toUpperCase();

    const existing = await couponRepository.findOne({
      where: { code: cleanCode },
    });

    if (existing) {
      throw new Error("COUPON_ALREADY_EXISTS");
    }

    const coupon = couponRepository.create({
      code: cleanCode,
      discountType: data.discountType || data.discount_type || "percentage",
      discountValue: Number(data.discountValue ?? data.discount_value ?? 0),
      minOrder: Number(data.minOrder ?? data.min_order ?? 0),
      maxUses: Number(data.maxUses ?? data.max_uses ?? 100),
      expiryDate: data.expiryDate || data.expiry_date || null,
      active: 1,
    });

    return await couponRepository.save(coupon);
  }

  async toggleCoupon(id: number): Promise<Coupon> {
    const coupon = await couponRepository.findOne({
      where: { id },
    });

    if (!coupon) {
      throw new Error("COUPON_NOT_FOUND");
    }

    coupon.active = coupon.active === 1 ? 0 : 1;
    return await couponRepository.save(coupon);
  }

  async deleteCoupon(id: number): Promise<void> {
    const coupon = await couponRepository.findOne({
      where: { id },
    });

    if (!coupon) {
      throw new Error("COUPON_NOT_FOUND");
    }

    await couponRepository.remove(coupon);
  }

  async getSettings(): Promise<Record<string, string>> {
    const settings = await settingRepository.find();
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;
    return map;
  }

  async updateSettings(
    newSettings: Record<string, string>
  ): Promise<Record<string, string>> {
    for (const [key, value] of Object.entries(newSettings)) {
      let setting = await settingRepository.findOne({ where: { key } });
      if (setting) {
        setting.value = String(value);
      } else {
        setting = settingRepository.create({ key, value: String(value) });
      }
      await settingRepository.save(setting);
    }

    return await this.getSettings();
  }

  async getAllProducts(): Promise<Product[]> {
    return await productRepository.find({
      order: { id: "ASC" },
    });
  }

  async saveProduct(
    idParam?: string,
    body?: any
  ): Promise<Product> {
    const id = idParam || `PROD-${crypto.randomUUID()}`;
    let product = await productRepository.findOne({ where: { id } });

    if (idParam && !product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    if (product) {
      Object.assign(product, body);
      return await productRepository.save(product);
    } else {
      const newProduct = productRepository.create({
        ...body,
        id,
      } as any) as unknown as Product;
      return await productRepository.save(newProduct);
    }
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await productRepository.findOne({ where: { id } });
    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }
    await productRepository.remove(product);
  }

  async getAllOrders(): Promise<any[]> {
    const orders = await orderRepository.find({
      order: { createdAt: "DESC" },
    });
    return orders.map((o) => {
      let items = [];
      try {
        items = typeof o.itemsJson === "string" ? JSON.parse(o.itemsJson) : (o.itemsJson || []);
      } catch {
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

  async updateOrderStatus(
    id: string,
    rawStatus: string,
    paymentStatus?: string
  ): Promise<Order> {
    const order = await orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new Error("ORDER_NOT_FOUND");
    }

    const lower = String(rawStatus || "").trim().toLowerCase();
    const map: Record<string, string> = {
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
    } else if (status === "Delivered") {
      order.paymentStatus = "Paid";
    }

    return await orderRepository.save(order);
  }

  async getSupportMessages(): Promise<SupportMessage[]> {
    return await supportMessageRepository.find({
      order: { createdAt: "DESC" },
    });
  }

  async updateSupportStatus(
    id: number,
    status: string
  ): Promise<SupportMessage> {
    const msg = await supportMessageRepository.findOne({ where: { id } });
    if (!msg) {
      throw new Error("RESOURCE_NOT_FOUND");
    }
    msg.status = status;
    return await supportMessageRepository.save(msg);
  }

  async getSubscribers(): Promise<Subscriber[]> {
    return await subscriberRepository.find({
      order: { createdAt: "DESC" },
    });
  }
}

export default new AdminService();
