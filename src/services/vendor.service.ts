import crypto from "crypto";
import { In } from "typeorm";

import {
  productRepository,
  vendorRepository,
  orderRepository,
  reviewRepository,
  userRepository,
} from "../repository";

import { Product } from "../entities/product.entity";
import { Vendor } from "../entities/vendor.entity";
import lifestyleService from "./lifestyle.service";
import authService from "./auth.service";

export class VendorService {
  async getVendorProducts(userId: number): Promise<Product[]> {
    return await productRepository.find({
      where: { vendorUserId: userId },
      order: { createdAt: "DESC" },
    });
  }

  async getVendorProductById(userId: number, productId: string): Promise<any> {
    const product = await productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    if (product.vendorUserId !== userId) {
      throw new Error("FORBIDDEN");
    }

    const lifestyles = await lifestyleService.getProductLifestyles(productId);

    return {
      ...product,
      lifestyleIds: lifestyles.map((l) => l.lifestyleId),
      lifestyles,
    };
  }

  async saveVendorProduct(
    userId: number,
    body: any,
    paramId?: string,
    vendorName?: string,
    vendorLocation?: string
  ): Promise<{ id: string }> {
    const id = paramId || `PROD-${crypto.randomUUID()}`;
    const current = await productRepository.findOne({
      where: { id },
    });

    if (paramId && !current) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    if (current && current.vendorUserId !== userId) {
      throw new Error("FORBIDDEN");
    }

    const vendor = await vendorRepository.findOne({
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
      await productRepository.save(current);
    } else {
      const newProduct = productRepository.create({
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
      await productRepository.save(newProduct);
    }

    if (body.lifestyles !== undefined || body.lifestyleIds !== undefined) {
      const assignments =
        body.lifestyles ||
        (Array.isArray(body.lifestyleIds)
          ? body.lifestyleIds.map((lid: string) => ({
              lifestyleId: lid,
              subcategory: body.lifestyleSubcategory || null,
            }))
          : []);
      await lifestyleService.assignProductLifestyles(id, assignments);
    }

    return { id };
  }

  async deleteVendorProduct(
    userId: number,
    productId: string
  ): Promise<void> {
    const product = await productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    if (product.vendorUserId !== userId) {
      throw new Error("FORBIDDEN");
    }

    product.active = 0;
    await productRepository.save(product);
  }

  async getVendorOrders(userId: number): Promise<any[]> {
    const vendorProducts = await productRepository.find({
      where: { vendorUserId: userId },
    });

    // If vendor has no products, they strictly have 0 orders (NO DATA LEAKAGE)
    if (vendorProducts.length === 0) {
      return [];
    }

    const vendorProductIds = new Set(vendorProducts.map((p) => String(p.id)));

    const vendor = await vendorRepository.findOne({ where: { userId } });
    const vendorName = vendor?.businessName?.trim().toLowerCase();

    const allOrders = await orderRepository.find({
      order: { createdAt: "DESC" },
    });

    const matchingOrders: any[] = [];

    for (const order of allOrders) {
      let items: any[] = [];
      try {
        items = JSON.parse(order.itemsJson || "[]");
      } catch {
        items = [];
      }

      const vendorItems = items.filter((item: any) => {
        const idMatches = item.productId && vendorProductIds.has(String(item.productId));
        const sellerMatches =
          vendorName && item.seller && String(item.seller).trim().toLowerCase() === vendorName;
        return idMatches || sellerMatches;
      });

      // Strictly only include orders that have items belonging to this vendor
      if (vendorItems.length > 0) {
        const vendorSubtotal = vendorItems.reduce(
          (sum: number, it: any) => sum + Number(it.price || 0) * Number(it.quantity || 1),
          0
        );

        // Derive vendor-specific item status if items have it, else fallback to order status
        const itemStatuses = vendorItems.map((it: any) => it.status || order.status);
        const allSameStatus = itemStatuses.every((s: string) => s === itemStatuses[0]);
        const vendorOrderStatus = allSameStatus ? itemStatuses[0] : order.status;

        matchingOrders.push({
          id: order.id,
          date: order.date,
          status: vendorOrderStatus,
          orderStatus: order.status,
          total: vendorSubtotal,
          subtotal: vendorSubtotal,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          deliveryAddress: order.deliveryAddress,
          recipientName: order.recipientName,
          recipientPhone: order.recipientPhone,
          items: vendorItems,
          createdAt: order.createdAt,
        });
      }
    }

    return matchingOrders;
  }

  async updateVendorOrderStatus(
    userId: number,
    orderId: string,
    newStatus: string
  ): Promise<any> {
    const order = await orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error("ORDER_NOT_FOUND");
    }

    const vendorProducts = await productRepository.find({
      where: { vendorUserId: userId },
    });
    const vendorProductIds = new Set(vendorProducts.map((p) => String(p.id)));

    const vendor = await vendorRepository.findOne({ where: { userId } });
    const vendorName = vendor?.businessName?.trim().toLowerCase();

    let items: any[] = [];
    try {
      items = JSON.parse(order.itemsJson || "[]");
    } catch {
      items = [];
    }

    // Canonical status mapping
    const statusMap: Record<string, string> = {
      pending: "Pending",
      incoming: "Pending",
      preparing: "Preparing",
      ready: "Ready",
      shipped: "Shipped",
      delivered: "Delivered",
      completed: "Delivered",
      cancelled: "Cancelled",
      declined: "Cancelled",
    };
    const canonicalStatus = statusMap[newStatus.trim().toLowerCase()] || (newStatus.charAt(0).toUpperCase() + newStatus.slice(1));

    let foundVendorItem = false;
    for (const item of items) {
      const idMatches = item.productId && vendorProductIds.has(String(item.productId));
      const sellerMatches =
        vendorName && item.seller && String(item.seller).trim().toLowerCase() === vendorName;
      if (idMatches || sellerMatches) {
        foundVendorItem = true;
        item.status = canonicalStatus;
      }
    }

    if (!foundVendorItem) {
      throw new Error("FORBIDDEN");
    }

    const previousStatus = order.status;

    // Check if all items in the order now share the same status, or if order only has this vendor's items
    const allStatuses = items.map((it: any) => it.status || canonicalStatus);
    const allSame = allStatuses.every((s: string) => String(s).toLowerCase() === canonicalStatus.toLowerCase());
    if (allSame || items.length === 1) {
      order.status = canonicalStatus;
    } else {
      order.status = canonicalStatus;
    }

    // If delivered, mark paymentStatus as Paid if COD or Pending
    if (canonicalStatus === "Delivered") {
      order.paymentStatus = "Paid";
    }

    // If cancelled, restock vendor items if order was not already cancelled
    if (canonicalStatus === "Cancelled" && String(previousStatus).toLowerCase() !== "cancelled") {
      for (const item of items) {
        const idMatches = item.productId && vendorProductIds.has(String(item.productId));
        if (idMatches) {
          const prod = await productRepository.findOne({ where: { id: String(item.productId) } });
          if (prod) {
            prod.stock = Number(prod.stock || 0) + Number(item.quantity || 1);
            await productRepository.save(prod);
          }
        }
      }
    }

    order.itemsJson = JSON.stringify(items);
    await orderRepository.save(order);

    return { ok: true, status: canonicalStatus };
  }

  async getVendorDashboard(userId: number): Promise<any> {
    const vendor = await vendorRepository.findOne({ where: { userId } });
    const products = await productRepository.find({ where: { vendorUserId: userId } });

    if (products.length === 0) {
      return {
        stats: {
          totalRevenue: 0,
          totalOrders: 0,
          pendingOrders: 0,
          activeProducts: 0,
          lowStockProducts: 0,
          averageRating: "No ratings yet",
          ratingCount: 0,
        },
        chart: [],
        bestsellers: [],
        recentOrders: [],
        vendorStatus: vendor?.status || "under_review",
      };
    }

    const vendorProductIds = products.map((p) => String(p.id));
    const activeProducts = products.filter((p) => p.active === 1).length;
    const lowStockProducts = products.filter((p) => p.active === 1 && Number(p.stock) <= 10).length;

    // Real reviews for vendor's products
    let avgRatingStr = "No ratings yet";
    let reviewCount = 0;
    if (vendorProductIds.length > 0) {
      const reviews = await reviewRepository.find({
        where: { productId: In(vendorProductIds) },
      });
      reviewCount = reviews.length;
      if (reviewCount > 0) {
        const sum = reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
        avgRatingStr = (sum / reviewCount).toFixed(1);
      }
    }

    // Real vendor orders
    const vendorOrders = await this.getVendorOrders(userId);
    const totalOrders = vendorOrders.length;
    const pendingOrders = vendorOrders.filter((o) =>
      ["pending", "processing", "preparing"].includes(String(o.status).toLowerCase())
    ).length;

    const totalRevenue = vendorOrders
      .filter((o) => String(o.status).toLowerCase() !== "cancelled")
      .reduce((sum, o) => sum + Number(o.total || 0), 0);

    // 7-day Sales Performance Chart
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const chartData: { date: string; label: string; revenue: number; orders: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const isoDate = d.toISOString().split("T")[0];
      const label = i === 0 ? "Today" : `${dayNames[d.getDay()]} ${d.getDate()}`;

      // Sum matching orders for this day
      const dayOrders = vendorOrders.filter((o) => {
        const orderDateStr = o.createdAt
          ? new Date(o.createdAt).toISOString().split("T")[0]
          : o.date
          ? new Date(o.date).toISOString().split("T")[0]
          : "";
        return orderDateStr === isoDate && String(o.status).toLowerCase() !== "cancelled";
      });

      const dayRevenue = dayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
      chartData.push({
        date: isoDate,
        label,
        revenue: dayRevenue,
        orders: dayOrders.length,
      });
    }

    // Real bestsellers: aggregated from vendor orders
    const productSalesMap = new Map<string, { qty: number; revenue: number }>();
    for (const order of vendorOrders) {
      if (String(order.status).toLowerCase() !== "cancelled") {
        for (const item of order.items || []) {
          const pid = String(item.productId);
          const current = productSalesMap.get(pid) || { qty: 0, revenue: 0 };
          current.qty += Number(item.quantity || 1);
          current.revenue += Number(item.price || 0) * Number(item.quantity || 1);
          productSalesMap.set(pid, current);
        }
      }
    }

    const bestsellers = products
      .map((p) => {
        const sales = productSalesMap.get(String(p.id)) || { qty: 0, revenue: 0 };
        return {
          id: p.id,
          name: p.name,
          place: p.origin || "Nepal",
          sold: sales.qty > 0 ? `${sales.qty} units sold` : "0 sold",
          soldCount: sales.qty,
          revenue: sales.revenue,
          image: p.image || "/src/frontend/assets/images/organic-vegetables.jpg",
          price: p.price,
          stock: p.stock,
        };
      })
      .filter((p) => p.soldCount > 0)
      .sort((a, b) => b.soldCount - a.soldCount)
      .slice(0, 5);

    const recentOrders = vendorOrders.slice(0, 5);

    return {
      stats: {
        totalRevenue,
        totalOrders,
        pendingOrders,
        activeProducts,
        lowStockProducts,
        averageRating: avgRatingStr,
        ratingCount: reviewCount,
      },
      chart: chartData,
      bestsellers,
      recentOrders,
      vendorStatus: vendor?.status || "under_review",
    };
  }

  async getVendorSales(userId: number): Promise<any> {
    const vendorOrders = await this.getVendorOrders(userId);
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let todaySales = 0;
    let weeklySales = 0;
    let monthlySales = 0;
    let totalSales = 0;
    let completedOrders = 0;
    let pendingPayments = 0;

    const transactions: any[] = [];

    for (const order of vendorOrders) {
      const orderDate = order.createdAt ? new Date(order.createdAt) : new Date(order.date || Date.now());
      const orderDateStr = orderDate.toISOString().split("T")[0];
      const isCancelled = String(order.status).toLowerCase() === "cancelled";
      const amount = Number(order.total || 0);

      if (!isCancelled) {
        totalSales += amount;
        if (orderDateStr === todayStr) {
          todaySales += amount;
        }
        if (orderDate >= sevenDaysAgo) {
          weeklySales += amount;
        }
        if (orderDate >= thirtyDaysAgo) {
          monthlySales += amount;
        }
      }

      if (["delivered", "completed"].includes(String(order.status).toLowerCase())) {
        completedOrders += 1;
      }
      if (String(order.paymentStatus).toLowerCase() === "pending") {
        pendingPayments += 1;
      }

      const itemsSummary = (order.items || []).map((it: any) => `${it.name || "Item"} x ${it.quantity || 1}`).join(", ") || "Fresh Produce";

      transactions.push({
        id: order.id,
        date: order.date || orderDateStr,
        customer: order.recipientName || "Customer",
        phone: order.recipientPhone || "",
        items: itemsSummary,
        itemsCount: (order.items || []).length,
        amount,
        status: order.status,
        payment: `${order.paymentMethod || "COD"} (${order.paymentStatus || "Pending"})`,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
      });
    }

    return {
      metrics: {
        todaySales,
        weeklySales,
        monthlySales,
        totalSales,
        completedOrders,
        pendingPayments,
        totalOrders: vendorOrders.length,
      },
      transactions,
    };
  }

  async getVendorReports(userId: number, range = "30days"): Promise<any> {
    const vendorOrders = await this.getVendorOrders(userId);
    const products = await productRepository.find({ where: { vendorUserId: userId } });

    const totalSales = vendorOrders
      .filter((o) => String(o.status).toLowerCase() !== "cancelled")
      .reduce((sum, o) => sum + Number(o.total || 0), 0);

    const completedOrders = vendorOrders.filter((o) =>
      ["delivered", "completed"].includes(String(o.status).toLowerCase())
    ).length;

    const avgOrderValue = vendorOrders.length > 0 ? Math.round(totalSales / vendorOrders.length) : 0;

    // Category distribution
    const categoryMap = new Map<string, { sales: number; count: number }>();
    for (const order of vendorOrders) {
      if (String(order.status).toLowerCase() !== "cancelled") {
        for (const item of order.items || []) {
          const cat = item.category || "General";
          const current = categoryMap.get(cat) || { sales: 0, count: 0 };
          const itemTotal = Number(item.price || 0) * Number(item.quantity || 1);
          current.sales += itemTotal;
          current.count += Number(item.quantity || 1);
          categoryMap.set(cat, current);
        }
      }
    }

    const colors = ["#176136", "#e3942d", "#d4a017", "#3f4a43", "#355845", "#2e7d32"];
    const categories = Array.from(categoryMap.entries()).map(([category, val], idx) => {
      const percentage = totalSales > 0 ? Math.round((val.sales / totalSales) * 100) : 0;
      return {
        name: category,
        sales: val.sales,
        share: `${percentage}%`,
        amount: `Rs. ${val.sales.toLocaleString()}`,
        width: `${percentage}%`,
        color: colors[idx % colors.length],
        percentage,
        count: val.count,
      };
    });

    // Generate dynamic chart bars for requested range
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const bars: { day: string; height: number; amount: number; orders: number }[] = [];
    const now = new Date();
    const daysCount = range === "7days" ? 7 : range === "1year" ? 12 : 30;

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      const offset = range === "7days" ? i : Math.round(i * (daysCount / 7));
      d.setDate(d.getDate() - offset);
      const iso = d.toISOString().split("T")[0];
      const dayLetter = dayLabels[d.getDay()][0];

      const matches = vendorOrders.filter((o) => {
        const od = o.createdAt
          ? new Date(o.createdAt).toISOString().split("T")[0]
          : o.date
          ? new Date(o.date).toISOString().split("T")[0]
          : "";
        return od === iso && String(o.status).toLowerCase() !== "cancelled";
      });
      const rev = matches.reduce((sum, o) => sum + Number(o.total || 0), 0);
      bars.push({ day: dayLetter, height: 0, amount: rev, orders: matches.length });
    }

    const peakBar = Math.max(...bars.map((b) => b.amount), 1);
    for (const b of bars) {
      b.height = b.amount > 0 ? Math.max(15, Math.round((b.amount / peakBar) * 100)) : 8;
    }

    // Order status counts
    const statusCounts: Record<string, number> = {
      pending: 0,
      preparing: 0,
      ready: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    for (const order of vendorOrders) {
      const st = String(order.status).toLowerCase();
      if (statusCounts[st] !== undefined) {
        statusCounts[st] += 1;
      } else {
        statusCounts[st] = 1;
      }
    }

    const recentTransactions = vendorOrders.slice(0, 5).map((o) => ({
      id: o.id,
      customer: o.recipientName || "Customer",
      date: o.date || (o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ""),
      amount: `Rs. ${Number(o.total || 0).toLocaleString()}`,
      status: o.status,
    }));

    return {
      range,
      metrics: {
        grossRevenue: totalSales,
        netRevenue: totalSales,
        totalOrders: vendorOrders.length,
        completedOrders,
        avgOrderValue,
      },
      bars,
      categories,
      statusCounts,
      transactions: recentTransactions,
      productsCount: products.length,
    };
  }

  async getVendorCustomers(userId: number): Promise<any[]> {
    const vendorOrders = await this.getVendorOrders(userId);
    if (vendorOrders.length === 0) {
      return [];
    }

    const customerMap = new Map<string, {
      name: string;
      phone: string;
      location: string;
      ordersCount: number;
      totalSpent: number;
      lastOrderDate: string;
    }>();

    for (const order of vendorOrders) {
      const key = `${order.recipientName || "Customer"}_${order.recipientPhone || ""}`;
      const current = customerMap.get(key) || {
        name: order.recipientName || "Customer",
        phone: order.recipientPhone || "-",
        location: order.deliveryAddress || "Kathmandu, Nepal",
        ordersCount: 0,
        totalSpent: 0,
        lastOrderDate: order.date || "",
      };

      current.ordersCount += 1;
      current.totalSpent += Number(order.total || 0);
      if (!current.lastOrderDate || new Date(order.date || 0) > new Date(current.lastOrderDate)) {
        current.lastOrderDate = order.date || current.lastOrderDate;
      }
      customerMap.set(key, current);
    }

    return Array.from(customerMap.values()).map((c, index) => ({
      id: `CUST-${index + 1}`,
      name: c.name,
      phone: c.phone,
      email: `${c.name.toLowerCase().replace(/\s+/g, ".")}@customer.np`,
      location: c.location,
      orders: c.ordersCount,
      ordersCount: c.ordersCount,
      spent: c.totalSpent,
      totalSpent: c.totalSpent,
      lastOrder: c.lastOrderDate || "Recent",
      lastOrderDate: c.lastOrderDate || "Recent",
      status: c.ordersCount > 1 ? ("Repeat" as const) : ("New" as const),
    }));
  }

  async getVendorReviews(userId: number): Promise<any> {
    const vendorProducts = await productRepository.find({
      where: { vendorUserId: userId },
    });

    if (vendorProducts.length === 0) {
      return {
        reviews: [],
        averageRating: 0,
        totalReviews: 0,
        ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    const productMap = new Map(vendorProducts.map((p) => [String(p.id), p]));
    const productIds = vendorProducts.map((p) => String(p.id));

    const reviews = await reviewRepository.find({
      where: { productId: In(productIds) },
      order: { createdAt: "DESC" },
    });

    const ratingBreakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let ratingSum = 0;

    const userIds = Array.from(new Set(reviews.map((r) => r.userId).filter(Boolean)));
    const users = userIds.length > 0 ? await userRepository.find({ where: { id: In(userIds) } }) : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    const formattedReviews = reviews.map((r) => {
      const prod = productMap.get(String(r.productId));
      const reviewer = userMap.get(r.userId);
      const rating = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
      ratingBreakdown[rating] = (ratingBreakdown[rating] || 0) + 1;
      ratingSum += rating;

      return {
        id: r.id,
        productId: r.productId,
        productName: prod?.name || "Product",
        product: prod?.name || "Product",
        productImage: prod?.image || "/src/frontend/assets/images/organic-vegetables.jpg",
        reviewerName: reviewer ? `${reviewer.firstName} ${reviewer.lastName}`.trim() : "Verified Customer",
        customer: reviewer ? `${reviewer.firstName} ${reviewer.lastName}`.trim() : "Verified Customer",
        email: reviewer?.email || "",
        rating: r.rating,
        title: r.title,
        body: r.body,
        comment: r.body || r.title || "No comment provided.",
        status: r.reply ? "Published" : "Pending Reply",
        reply: r.reply || "",
        replyAt: r.replyAt,
        date: r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "",
        createdAt: r.createdAt,
      };
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 ? Number((ratingSum / totalReviews).toFixed(1)) : 0;

    return {
      reviews: formattedReviews,
      averageRating,
      totalReviews,
      ratingBreakdown,
    };
  }

  async replyVendorReview(userId: number, reviewId: number, replyText: string): Promise<any> {
    const review = await reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new Error("REVIEW_NOT_FOUND");
    }

    const product = await productRepository.findOne({
      where: { id: review.productId },
    });

    if (!product || product.vendorUserId !== userId) {
      throw new Error("FORBIDDEN");
    }

    review.reply = replyText.trim();
    review.replyAt = new Date();
    await reviewRepository.save(review);

    return {
      id: review.id,
      reply: review.reply,
      replyAt: review.replyAt,
    };
  }

  async getVendorNotifications(userId: number): Promise<any[]> {
    const notifications: any[] = [];
    const vendor = await vendorRepository.findOne({ where: { userId } });
    const products = await productRepository.find({ where: { vendorUserId: userId } });

    // Vendor verification status
    if (vendor && vendor.status === "under_review") {
      notifications.push({
        id: "status-under-review",
        text: "Your vendor account is currently under review by our administration team.",
        to: "/vendor/profile",
        type: "info",
      });
    }

    // Low stock alerts
    const lowStock = products.filter((p) => p.active === 1 && Number(p.stock) <= 10);
    for (const p of lowStock.slice(0, 3)) {
      notifications.push({
        id: `stock-${p.id}`,
        text: `${p.name} is running low on stock (${p.stock} remaining).`,
        to: "/vendor/products",
        type: "stock",
      });
    }

    // Pending orders alerts
    const orders = await this.getVendorOrders(userId);
    const pending = orders.filter((o) =>
      ["pending", "processing", "preparing"].includes(String(o.status).toLowerCase())
    );
    if (pending.length > 0) {
      notifications.push({
        id: "orders-pending",
        text: `${pending.length} incoming order(s) waiting for preparation or dispatch.`,
        to: "/vendor/orders",
        type: "order",
      });
    }

    // Unanswered reviews alerts
    const productIds = products.map((p) => String(p.id));
    if (productIds.length > 0) {
      const reviews = await reviewRepository.find({
        where: { productId: In(productIds) },
        order: { createdAt: "DESC" },
        take: 10,
      });
      const unreplied = reviews.filter((r) => !r.reply);
      if (unreplied.length > 0) {
        notifications.push({
          id: "reviews-unreplied",
          text: `${unreplied.length} customer review(s) await your store reply.`,
          to: "/vendor/reviews",
          type: "review",
        });
      }
    }

    return notifications;
  }

  async getVendorProfile(userId: number): Promise<any> {
    const vendor = await vendorRepository.findOne({ where: { userId } });
    const user = await userRepository.findOne({ where: { id: userId } });

    if (!vendor || !user) {
      throw new Error("VENDOR_NOT_FOUND");
    }

    let parsedSocials = { website: "", facebook: "", instagram: "", twitter: "" };
    if (vendor.storeSocials) {
      try {
        parsedSocials = { ...parsedSocials, ...JSON.parse(vendor.storeSocials) };
      } catch {
        // default fallback
      }
    }

    return {
      userId: vendor.userId,
      businessName: vendor.businessName,
      vendorType: vendor.vendorType,
      location: vendor.location,
      district: vendor.district,
      address: vendor.address,
      category: vendor.category,
      mainProducts: vendor.mainProducts || "",
      description: vendor.description || "",
      photo: user.photo || "",
      profileImage: user.photo || "",
      storeLogo: vendor.storeLogo || "",
      storeBanner: vendor.storeBanner || "",
      storeEmail: vendor.storeEmail || user.email || "",
      storePhone: vendor.storePhone || user.phone || "",
      storeHours: vendor.storeHours || "7:00 AM - 6:00 PM",
      storeSocials: parsedSocials,
      documentName: vendor.documentName || "",
      status: vendor.status,
      contact: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || "",
      },
    };
  }

  async updateVendorProfile(userId: number, body: any): Promise<any> {
    const vendor = await vendorRepository.findOne({ where: { userId } });
    const user = await userRepository.findOne({ where: { id: userId } });

    if (!vendor || !user) {
      throw new Error("VENDOR_NOT_FOUND");
    }

    if (body.businessName !== undefined) vendor.businessName = body.businessName.trim();
    if (body.vendorType !== undefined) vendor.vendorType = body.vendorType.trim();
    if (body.location !== undefined) vendor.location = body.location.trim();
    if (body.district !== undefined) vendor.district = body.district.trim();
    if (body.address !== undefined) vendor.address = body.address.trim();
    if (body.category !== undefined) vendor.category = body.category.trim();
    if (body.mainProducts !== undefined) vendor.mainProducts = body.mainProducts;
    if (body.description !== undefined) vendor.description = body.description;

    // Store Branding & Contact
    if (body.storeLogo !== undefined) {
      vendor.storeLogo = body.storeLogo || null;
      if (!vendor.photo || vendor.photo === vendor.storeLogo) {
        vendor.photo = body.storeLogo || null;
      }
    }
    if (body.storeBanner !== undefined) vendor.storeBanner = body.storeBanner || null;
    if (body.storeEmail !== undefined) vendor.storeEmail = body.storeEmail.trim();
    if (body.storePhone !== undefined) vendor.storePhone = body.storePhone.trim();
    if (body.storeHours !== undefined) vendor.storeHours = body.storeHours.trim();
    if (body.storeSocials !== undefined) {
      if (typeof body.storeSocials === "object") {
        vendor.storeSocials = JSON.stringify(body.storeSocials);
      } else if (typeof body.storeSocials === "string") {
        vendor.storeSocials = body.storeSocials;
      }
    }

    // Personal user avatar
    if (body.profileImage !== undefined) {
      user.photo = body.profileImage || "";
    } else if (body.photo !== undefined && !body.storeLogo) {
      user.photo = body.photo || "";
    }

    // Personal contact information
    if (body.firstName !== undefined) user.firstName = body.firstName.trim();
    if (body.lastName !== undefined) user.lastName = body.lastName.trim();
    if (body.phone !== undefined) user.phone = body.phone.trim();

    await vendorRepository.save(vendor);
    await userRepository.save(user);

    return await this.getVendorProfile(userId);
  }

  async updateVendorAvatar(userId: number, fileUrl: string): Promise<any> {
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) throw new Error("USER_NOT_FOUND");
    user.photo = fileUrl;
    await userRepository.save(user);
    return await this.getVendorProfile(userId);
  }

  async deleteVendorAvatar(userId: number): Promise<any> {
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) throw new Error("USER_NOT_FOUND");
    user.photo = "";
    await userRepository.save(user);
    return await this.getVendorProfile(userId);
  }

  async updateStoreLogo(userId: number, fileUrl: string): Promise<any> {
    const vendor = await vendorRepository.findOne({ where: { userId } });
    if (!vendor) throw new Error("VENDOR_NOT_FOUND");
    vendor.storeLogo = fileUrl;
    vendor.photo = fileUrl;
    await vendorRepository.save(vendor);
    return await this.getVendorProfile(userId);
  }

  async deleteStoreLogo(userId: number): Promise<any> {
    const vendor = await vendorRepository.findOne({ where: { userId } });
    if (!vendor) throw new Error("VENDOR_NOT_FOUND");
    vendor.storeLogo = null as any;
    vendor.photo = null as any;
    await vendorRepository.save(vendor);
    return await this.getVendorProfile(userId);
  }

  async updateStoreBanner(userId: number, fileUrl: string): Promise<any> {
    const vendor = await vendorRepository.findOne({ where: { userId } });
    if (!vendor) throw new Error("VENDOR_NOT_FOUND");
    vendor.storeBanner = fileUrl;
    await vendorRepository.save(vendor);
    return await this.getVendorProfile(userId);
  }

  async deleteStoreBanner(userId: number): Promise<any> {
    const vendor = await vendorRepository.findOne({ where: { userId } });
    if (!vendor) throw new Error("VENDOR_NOT_FOUND");
    vendor.storeBanner = null as any;
    await vendorRepository.save(vendor);
    return await this.getVendorProfile(userId);
  }

  async changeVendorPassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    await authService.changePassword(userId, currentPassword, newPassword);
  }

  async getVendorSettings(userId: number): Promise<any> {
    const vendor = await vendorRepository.findOne({ where: { userId } });
    let settings = {
      orderAlerts: true,
      lowStockAlerts: true,
      reviewAlerts: true,
      emailNotifications: true,
      vacationMode: false,
      payoutMethod: "Bank Transfer",
      accountNumber: "",
      bankName: "",
    };

    if (vendor?.settings) {
      try {
        settings = { ...settings, ...JSON.parse(vendor.settings) };
      } catch {
        // use defaults
      }
    }

    return settings;
  }

  async updateVendorSettings(userId: number, body: any): Promise<any> {
    const vendor = await vendorRepository.findOne({ where: { userId } });
    if (!vendor) {
      throw new Error("VENDOR_NOT_FOUND");
    }

    let existing = {};
    if (vendor.settings) {
      try {
        existing = JSON.parse(vendor.settings);
      } catch {
        existing = {};
      }
    }

    const updated = { ...existing, ...body };
    vendor.settings = JSON.stringify(updated);
    await vendorRepository.save(vendor);

    return updated;
  }
}

export default new VendorService();
