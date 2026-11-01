import { UserRole } from "../entities/user.entity";

export interface RegisterAddressData {
  fullName: string;
  phone: string;
  addressLine?: string;
  street?: string;
  city: string;
  district?: string;
  province?: string;
  postalCode?: string;
  area?: string;
  label?: string;
}

export interface RegisterUserData {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email: string;
  password: string;
  phone?: string;
  location?: string;
  address?: RegisterAddressData | string;
  role?: UserRole | string;
  photo?: string;
  city?: string;
}

export interface RegisterVendorData extends RegisterUserData {
  businessName?: string;
  shopName?: string;
  shopAddress?: string;
  category?: string;
  vendor?: {
    businessName: string;
    vendorType: string;
    location: string;
    district: string;
    address: string;
    category: string;
    mainProducts?: string;
    description?: string;
    photo?: string;
    documentName?: string;
  };
}

export interface RegisterAdminData extends RegisterUserData {
  adminInviteKey: string;
}

export interface LoginUserData {
  email?: string;
  identifier?: string;
  phone?: string;
  password: string;
  expectedRole?: string;
}

export interface SafeUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  role: UserRole | string;
  isVerified: boolean;
  rewardPoints: number;
  referralCode?: string | null;
  photo?: string | null;
  shop?: any;
  vendor?: any;
}

export interface AuthResponse {
  user: SafeUser;
  token?: string;
  addresses?: any[];
  cart?: any[];
  wishlist?: any[];
  orders?: any[];
  rewards?: any[];
  points?: number;
}
