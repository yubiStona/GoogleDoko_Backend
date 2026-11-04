import crypto from "crypto";

import {
  orderRepository,
  productRepository,
  userRepository,
  cartRepository,
  couponRepository,
  settingRepository,
  rewardLogRepository,
} from "../repository";

import { Order } from "../entities/order.entity";
import { Product } from "../entities/product.entity";
import { User } from "../entities/user.entity";
import { Cart } from "../entities/cart.entity";
import { Coupon, CouponRedemption } from "../entities/coupon.entity";
import { RewardLog } from "../entities/reward-log.entity";
import { appDataSource } from "../config/database";

export interface CreateOrderInput {
  id?: string;
  items: Array<{ productId?: string; id?: string; quantity: number }>;
  deliveryAddress: string;
  recipientName: string;
  recipientPhone: string;
  paymentMethod?: string;
  couponCode?: string;
  discount?: number;
  fromCart?: boolean;
}

export class OrderService {
  async createCheckoutOrder(
    userId: number,
    userRole: string,
    body: CreateOrderInput
  ): Promise<{ id: string; order: Order; orders: Order[] }> {
    if (userRole !== "customer") {
      throw new Error("FORBIDDEN");
    }

    if (
      !Array.isArray(body.items) ||
      body.items.length === 0 ||
      !body.deliveryAddress ||
      !body.recipientName ||
      !body.recipientPhone
    ) {
      throw new Error("VALIDATION_FAILED");
    }

    const validMethods = [
      "Cash on Delivery",
      "eSewa Mobile Wallet",
      "Khalti Wallet",
      "Direct Bank Transfer",
    ];

    const paymentMethod = validMethods.includes(body.paymentMethod || "")
      ? body.paymentMethod!
      : "Cash on Delivery";

    // Orders always begin as Pending until server-side gateway verification
    const paymentStatus = "Pending";

    const orderId = body.id || `GD-${crypto.randomUUID()}`;

    const existingOrder = await orderRepository.findOne({
      where: { id: orderId },
    });

    if (existingOrder) {
      if (existingOrder.userId === userId) {
        return {
          id: orderId,
          order: existingOrder,
          orders: await orderRepository.find({ where: { userId }, order: { createdAt: "DESC" } }),
        };
      }
      throw new Error("ORDER_ALREADY_EXISTS");
    }

    // Normalize and validate input items
    const normalizedItems: Array<{
      productId: string;
      quantity: number;
      variant?: any;
    }> = [];

    for (const item of body.items) {
      const pid = String(item.productId || (item as any).id || "");
      const q = Number(item.quantity);
      if (!pid || isNaN(q) || q <= 0) {
        throw new Error("VALIDATION_FAILED");
      }
      normalizedItems.push({
        productId: pid,
        quantity: q,
        variant: (item as any).variant || null,
      });
    }

    const savedOrder = await appDataSource.transaction(async (transactionManager) => {
      const txProductRepo = transactionManager.getRepository(Product);
      const txOrderRepo = transactionManager.getRepository(Order);
      const txCartRepo = transactionManager.getRepository(Cart);
      const txCouponRepo = transactionManager.getRepository(Coupon);
      const txUserRepo = transactionManager.getRepository(User);
      const txRewardRepo = transactionManager.getRepository(RewardLog);
      const txRedemptionRepo = transactionManager.getRepository(CouponRedemption);

      const items: any[] = [];

      for (const reqItem of normalizedItems) {
        const { productId, quantity, variant: chosenVariant } = reqItem;
        const product = await txProductRepo
          .createQueryBuilder("product")
          .setLock("pessimistic_write")
          .where("product.id = :id AND product.active = 1", { id: productId })
          .getOne();

        if (!product) {
          throw new Error("PRODUCT_NOT_FOUND");
        }

        // Validate whole-number restriction for discrete items
        if (product.allowDecimals !== 1 && !Number.isInteger(quantity)) {
          throw new Error("VALIDATION_FAILED");
        }

        let effectivePrice = product.price;

        // If a variant is selected, deduct from variant stock
        if (chosenVariant && product.variantsJson) {
          try {
            const variants = JSON.parse(product.variantsJson);
            const foundIdx = variants.findIndex(
              (v: any) => v.id === chosenVariant.id || v.name === chosenVariant.name
            );
            if (foundIdx >= 0) {
              const v = variants[foundIdx];
              if (v.stock !== undefined) {
                if (v.stock < quantity) {
                  throw new Error("INSUFFICIENT_STOCK");
                }
                v.stock -= quantity;
              }
              if (v.price !== undefined) {
                effectivePrice = v.price;
              }
              product.variantsJson = JSON.stringify(variants);
            }
          } catch (e: any) {
            if (e?.message === "INSUFFICIENT_STOCK") throw e;
          }
        }

        if (product.stock < quantity) {
          throw new Error("INSUFFICIENT_STOCK");
        }

        product.stock -= quantity;
        await txProductRepo.save(product);

        items.push({
          productId,
          name: product.name,
          price: effectivePrice,
          image: product.image,
          weight: product.weight,
          sellingUnit: product.sellingUnit || "piece",
          variant: chosenVariant || null,
          quantity,
          vendorId: product.vendorUserId,
          seller: product.seller || "GoogleDoko Store",
          status: "Pending",
        });
      }

      const subtotal = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // Fetch delivery settings
      const settings = await settingRepository.find();
      const settingsMap: Record<string, string> = {};
      for (const s of settings) settingsMap[s.key] = s.value;

      const baseDeliveryFee = Number(settingsMap["delivery_fee"] || 50);
      const freeThreshold = Number(settingsMap["free_delivery_threshold"] || 1500);
      const deliveryFee = subtotal >= freeThreshold ? 0 : baseDeliveryFee;

      let discount = 0;
      let appliedCouponCode: string | null = null;

      if (body.couponCode) {
        const cleanCode = body.couponCode.trim().toUpperCase();
        const coupon = await txCouponRepo.findOne({
          where: { code: cleanCode, active: 1 },
        });

        if (coupon) {
          const now = Date.now();
          const notStarted = coupon.startDate && new Date(coupon.startDate).getTime() > now;
          const notExpired = !coupon.expiryDate || new Date(coupon.expiryDate).getTime() >= now;
          const hasUses = coupon.timesUsed < coupon.maxUses;
          const meetsMin = subtotal >= coupon.minOrder;

          // Check per customer limit
          let exceedsCustomerLimit = false;
          if (coupon.perCustomerLimit) {
            const customerUses = await txRedemptionRepo.count({
              where: { couponCode: cleanCode, userId },
            });
            if (customerUses >= coupon.perCustomerLimit) {
              exceedsCustomerLimit = true;
            }
          }

          // Check first order only
          let failsFirstOrder = false;
          if (coupon.firstOrderOnly) {
            const previousOrders = await txOrderRepo.count({ where: { userId } });
            if (previousOrders > 0) {
              failsFirstOrder = true;
            }
          }

          if (!notStarted && notExpired && hasUses && meetsMin && !exceedsCustomerLimit && !failsFirstOrder) {
            discount =
              coupon.discountType === "percentage"
                ? Math.round((subtotal * coupon.discountValue) / 100)
                : Math.min(subtotal, coupon.discountValue);

            if (coupon.maxDiscount && discount > coupon.maxDiscount) {
              discount = coupon.maxDiscount;
            }

            coupon.timesUsed += 1;
            await txCouponRepo.save(coupon);
            appliedCouponCode = cleanCode;

            // Save redemption log
            const redemption = txRedemptionRepo.create({
              couponCode: cleanCode,
              userId,
              orderId,
              discountAmount: discount,
            });
            await txRedemptionRepo.save(redemption);
          }
        }
      }

      // Proportional multi-vendor discount allocation across items
      let remainingDiscount = discount;
      items.forEach((item, idx) => {
        item.orderItemId = `${orderId}-${item.productId}`;
        const lineTotal = item.price * item.quantity;
        if (subtotal > 0 && discount > 0) {
          if (idx === items.length - 1) {
            item.allocatedDiscount = remainingDiscount;
          } else {
            const allocated = Math.round((lineTotal / subtotal) * discount);
            item.allocatedDiscount = Math.min(allocated, remainingDiscount);
            remainingDiscount -= item.allocatedDiscount;
          }
        } else {
          item.allocatedDiscount = 0;
        }
        item.netAmount = Math.max(0, lineTotal - item.allocatedDiscount);
      });

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

    const userOrders = await orderRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });

    return {
      id: orderId,
      order: savedOrder,
      orders: userOrders,
    };
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return await orderRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
  }

  async getOrderById(id: string, userId?: number, role?: string): Promise<Order> {
    const order = await orderRepository.findOne({
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

  async getAllOrders(): Promise<Order[]> {
    return await orderRepository.find({
      order: { createdAt: "DESC" },
    });
  }

  async updateOrderStatus(
    id: string,
    status: string,
    paymentStatus?: string
  ): Promise<Order> {
    const order = await orderRepository.findOne({
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
            const product = await productRepository.findOne({
              where: { id: item.productId },
            });
            if (product) {
              product.stock += Number(item.quantity);
              await productRepository.save(product);
            }
          }
        }
      } catch {
        // Continue if items JSON was malformed
      }
    }

    order.status = status;
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    } else if (status === "Delivered") {
      order.paymentStatus = "Paid";
    }

    return await orderRepository.save(order);
  }

  async getOrderTracking(orderId: string, userId?: number): Promise<any> {
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

export default new OrderService();
