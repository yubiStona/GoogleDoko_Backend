import { describe, it, expect, vi, beforeEach } from "vitest";
import vendorService from "../services/vendor.service";
import authService from "../services/auth.service";
import { vendorRepository, userRepository } from "../repository";

describe("Vendor Profile Management & Store Branding Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockUser: any = {
    id: 10,
    firstName: "Ram",
    lastName: "Sharma",
    email: "ram@farm.com",
    phone: "9800000000",
    photo: "/uploads/ram-avatar.jpg",
  };

  const mockVendor: any = {
    userId: 10,
    businessName: "Ram Organic Farm",
    vendorType: "Local Farm",
    location: "Kathmandu",
    district: "Kathmandu",
    address: "Kalimati, Ward 4",
    category: "Organic Fruits & Vegetables",
    mainProducts: "Apples, Spinach",
    description: "Freshly harvested organic mountain products.",
    photo: "/uploads/store-logo.png",
    storeLogo: "/uploads/store-logo.png",
    storeBanner: "/uploads/store-banner.jpg",
    storeEmail: "contact@ramfarm.com",
    storePhone: "01-4455667",
    storeHours: "6:00 AM - 7:00 PM",
    storeSocials: JSON.stringify({
      website: "https://ramfarm.com",
      facebook: "https://facebook.com/ramfarm",
      instagram: "https://instagram.com/ramfarm",
    }),
    documentName: "farm_cert.pdf",
    status: "approved",
  };

  describe("getVendorProfile", () => {
    it("returns complete profile with separate personal avatar and store branding", async () => {
      vi.spyOn(vendorRepository, "findOne").mockResolvedValue(mockVendor);
      vi.spyOn(userRepository, "findOne").mockResolvedValue(mockUser);

      const profile = await vendorService.getVendorProfile(10);

      expect(profile.userId).toBe(10);
      expect(profile.businessName).toBe("Ram Organic Farm");
      expect(profile.profileImage).toBe("/uploads/ram-avatar.jpg");
      expect(profile.storeLogo).toBe("/uploads/store-logo.png");
      expect(profile.storeBanner).toBe("/uploads/store-banner.jpg");
      expect(profile.storeEmail).toBe("contact@ramfarm.com");
      expect(profile.storePhone).toBe("01-4455667");
      expect(profile.storeHours).toBe("6:00 AM - 7:00 PM");
      expect(profile.storeSocials.website).toBe("https://ramfarm.com");
      expect(profile.contact.firstName).toBe("Ram");
      expect(profile.contact.email).toBe("ram@farm.com");
    });

    it("throws VENDOR_NOT_FOUND when vendor does not exist", async () => {
      vi.spyOn(vendorRepository, "findOne").mockResolvedValue(null);
      vi.spyOn(userRepository, "findOne").mockResolvedValue(mockUser);

      await expect(vendorService.getVendorProfile(999)).rejects.toThrow("VENDOR_NOT_FOUND");
    });
  });

  describe("updateVendorProfile", () => {
    it("updates personal contact info and store branding simultaneously", async () => {
      const vendorCopy = { ...mockVendor };
      const userCopy = { ...mockUser };

      vi.spyOn(vendorRepository, "findOne").mockResolvedValue(vendorCopy);
      vi.spyOn(userRepository, "findOne").mockResolvedValue(userCopy);
      vi.spyOn(vendorRepository, "save").mockImplementation(async (v: any) => v);
      vi.spyOn(userRepository, "save").mockImplementation(async (u: any) => u);

      const updated = await vendorService.updateVendorProfile(10, {
        firstName: "Ramesh",
        phone: "9811111111",
        businessName: "Ramesh Himalayan Organics",
        storeHours: "8:00 AM - 5:00 PM",
        storeEmail: "info@himalayanorganics.com",
        storeSocials: { website: "https://himalayanorganics.com" },
      });

      expect(userCopy.firstName).toBe("Ramesh");
      expect(userCopy.phone).toBe("9811111111");
      expect(vendorCopy.businessName).toBe("Ramesh Himalayan Organics");
      expect(vendorCopy.storeHours).toBe("8:00 AM - 5:00 PM");
      expect(vendorCopy.storeEmail).toBe("info@himalayanorganics.com");
      expect(updated.contact.firstName).toBe("Ramesh");
    });
  });

  describe("Avatar, Logo, and Banner Management", () => {
    it("updates personal avatar without affecting store logo", async () => {
      const userCopy = { ...mockUser, photo: "" };
      const vendorCopy = { ...mockVendor, storeLogo: "/uploads/store-logo.png" };

      vi.spyOn(userRepository, "findOne").mockResolvedValue(userCopy);
      vi.spyOn(vendorRepository, "findOne").mockResolvedValue(vendorCopy);
      vi.spyOn(userRepository, "save").mockImplementation(async (u: any) => u);

      const result = await vendorService.updateVendorAvatar(10, "/uploads/new-personal-avatar.jpg");

      expect(userCopy.photo).toBe("/uploads/new-personal-avatar.jpg");
      expect(result.profileImage).toBe("/uploads/new-personal-avatar.jpg");
      expect(result.storeLogo).toBe("/uploads/store-logo.png"); // Unaffected
    });

    it("removes personal avatar successfully", async () => {
      const userCopy = { ...mockUser, photo: "/uploads/ram.jpg" };
      const vendorCopy = { ...mockVendor };

      vi.spyOn(userRepository, "findOne").mockResolvedValue(userCopy);
      vi.spyOn(vendorRepository, "findOne").mockResolvedValue(vendorCopy);
      vi.spyOn(userRepository, "save").mockImplementation(async (u: any) => u);

      const result = await vendorService.deleteVendorAvatar(10);

      expect(userCopy.photo).toBe("");
      expect(result.profileImage).toBe("");
    });

    it("updates store logo and banner independently", async () => {
      const vendorCopy = { ...mockVendor };
      const userCopy = { ...mockUser };

      vi.spyOn(vendorRepository, "findOne").mockResolvedValue(vendorCopy);
      vi.spyOn(userRepository, "findOne").mockResolvedValue(userCopy);
      vi.spyOn(vendorRepository, "save").mockImplementation(async (v: any) => v);

      await vendorService.updateStoreLogo(10, "/uploads/new-logo.png");
      expect(vendorCopy.storeLogo).toBe("/uploads/new-logo.png");

      await vendorService.updateStoreBanner(10, "/uploads/new-banner.jpg");
      expect(vendorCopy.storeBanner).toBe("/uploads/new-banner.jpg");
    });

    it("removes store logo and store banner cleanly", async () => {
      const vendorCopy = { ...mockVendor };
      const userCopy = { ...mockUser };

      vi.spyOn(vendorRepository, "findOne").mockResolvedValue(vendorCopy);
      vi.spyOn(userRepository, "findOne").mockResolvedValue(userCopy);
      vi.spyOn(vendorRepository, "save").mockImplementation(async (v: any) => v);

      await vendorService.deleteStoreLogo(10);
      expect(vendorCopy.storeLogo).toBeFalsy();

      await vendorService.deleteStoreBanner(10);
      expect(vendorCopy.storeBanner).toBeFalsy();
    });
  });

  describe("Vendor Password Change", () => {
    it("delegates to authService.changePassword with current and new password", async () => {
      const changePasswordSpy = vi.spyOn(authService, "changePassword").mockResolvedValue();

      await vendorService.changeVendorPassword(10, "OldSecret123", "NewSecret456");

      expect(changePasswordSpy).toHaveBeenCalledWith(10, "OldSecret123", "NewSecret456");
    });

    it("rejects when authService throws CURRENT_PASSWORD_INCORRECT", async () => {
      vi.spyOn(authService, "changePassword").mockRejectedValue(new Error("CURRENT_PASSWORD_INCORRECT"));

      await expect(vendorService.changeVendorPassword(10, "WrongSecret", "NewSecret456")).rejects.toThrow(
        "CURRENT_PASSWORD_INCORRECT"
      );
    });
  });
});
