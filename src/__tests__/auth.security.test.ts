import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateToken, verifyToken, revokeToken, isTokenRevoked } from "../utils/jwt";
import authService from "../services/auth.service";
import { userRepository, addressRepository, orderRepository, rewardLogRepository, vendorRepository } from "../repository";
import cartService from "../services/cart.service";
import wishlistService from "../services/wishlist.service";
import { UserRole } from "../entities/user.entity";
import bcrypt from "bcryptjs";

describe("Backend Security & Authentication Audit", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects vendor login with hardcoded demo password if hash does not match", async () => {
    const fakeVendor = {
      id: 42,
      email: "vendor@googledoko.com",
      password: await bcrypt.hash("RealVendorPassword123!", 10),
      role: UserRole.VENDOR,
    };

    vi.spyOn(userRepository, "createQueryBuilder").mockReturnValue({
      addSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orWhere: vi.fn().mockReturnThis(),
      getOne: vi.fn().mockResolvedValue(fakeVendor),
    } as any);

    await expect(
      authService.login({
        identifier: "vendor@googledoko.com",
        password: "password123", // the old insecure demo password
      })
    ).rejects.toThrow("INVALID_CREDENTIALS");
  });

  it("strictly enforces ADMIN_INVITE_KEY environment variable on admin registration", async () => {
    const originalEnv = process.env.ADMIN_INVITE_KEY;
    delete process.env.ADMIN_INVITE_KEY;

    await expect(
      authService.registerAdmin({
        email: "attacker@example.com",
        password: "MasterPassword123!",
        adminInviteKey: "ADMIN_MASTER_KEY_2026",
      })
    ).rejects.toThrow("FORBIDDEN");

    process.env.ADMIN_INVITE_KEY = "SECRET_KEY_PROD_999";

    await expect(
      authService.registerAdmin({
        email: "attacker@example.com",
        password: "MasterPassword123!",
        adminInviteKey: "WRONG_KEY",
      })
    ).rejects.toThrow("FORBIDDEN");

    if (originalEnv) {
      process.env.ADMIN_INVITE_KEY = originalEnv;
    }
  });

  it("revokes JWT token upon logout", () => {
    const token = generateToken({ userId: 1, role: UserRole.CUSTOMER });
    const payload = verifyToken(token);
    expect(payload.userId).toBe(1);
    expect(isTokenRevoked(token)).toBe(false);

    revokeToken(token);
    expect(isTokenRevoked(token)).toBe(true);
  });

  it("builds session response for customer without unknown column errors", async () => {
    const fakeCustomer = {
      id: 99,
      firstName: "Ujala",
      lastName: "Sah",
      email: "ujala1@gmail.com",
      phone: "9800000000",
      location: "Kathmandu",
      role: UserRole.CUSTOMER,
      isVerified: true,
      rewardPoints: 100,
      referralCode: "REF99",
      photo: "",
    };

    vi.spyOn(userRepository, "findOne").mockResolvedValue(fakeCustomer as any);
    vi.spyOn(addressRepository, "find").mockResolvedValue([]);
    vi.spyOn(cartService, "getCart").mockResolvedValue({ items: [], subtotal: 0, count: 0 } as any);
    vi.spyOn(wishlistService, "getWishlist").mockResolvedValue([]);
    vi.spyOn(orderRepository, "find").mockResolvedValue([]);
    vi.spyOn(rewardLogRepository, "find").mockResolvedValue([]);
    vi.spyOn(vendorRepository, "findOne").mockResolvedValue(null);

    const session = await authService.buildSessionResponse(99, "test-token");
    expect(session.user.email).toBe("ujala1@gmail.com");
    expect(session.token).toBe("test-token");
    expect(session.orders).toEqual([]);
    expect(session.cart).toBeDefined();
  });
});
