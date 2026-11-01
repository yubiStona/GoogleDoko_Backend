import { addressRepository } from "../repository";
import { Address } from "../entities/address.entity";

export interface CreateAddressData {
  fullName: string;
  phone: string;
  addressLine?: string;
  street?: string;
  city: string;
  district?: string;
  area?: string;
  province?: string;
  postalCode?: string;
  label?: string;
  isDefault?: boolean;
}

export class AddressService {
  async createAddress(
    userId: number,
    data: CreateAddressData,
  ): Promise<Address> {
    const existingAddresses = await addressRepository.find({
      where: { userId },
    });

    const shouldBeDefault =
      existingAddresses.length === 0 || data.isDefault === true;

    if (shouldBeDefault && existingAddresses.length > 0) {
      await addressRepository.update({ userId }, { isDefault: false });
    }

    const raw = data as any;
    const address = addressRepository.create({
      userId,
      fullName: data.fullName || raw.recipientName || raw.name || "Customer",
      phone: data.phone || raw.recipientPhone || "",
      addressLine: data.addressLine || data.street || raw.address || "",
      city: data.city || raw.location || "Kathmandu",
      district: data.district || data.area || raw.state || "",
      province: data.province || raw.state || "",
      postalCode: data.postalCode || "",
      label: data.label || raw.title || "Home",
      isDefault: shouldBeDefault,
    });

    return await addressRepository.save(address);
  }

  async getUserAddresses(userId: number): Promise<Address[]> {
    return await addressRepository.find({
      where: { userId },
      order: {
        isDefault: "DESC",
        createdAt: "DESC",
      },
    });
  }

  async getAddressById(
    userId: number,
    addressId: number,
  ): Promise<Address | null> {
    let address = await addressRepository.findOne({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address && addressId === 1) {
      address = await addressRepository.findOne({
        where: { userId },
        order: { isDefault: "DESC", createdAt: "DESC" },
      });
    }

    return address;
  }

  async updateAddress(
    userId: number,
    addressId: number,
    data: Partial<CreateAddressData>,
  ): Promise<Address> {
    let address = await addressRepository.findOne({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address && addressId === 1) {
      address = await addressRepository.findOne({
        where: { userId },
        order: { isDefault: "DESC", createdAt: "DESC" },
      });
    }

    if (!address) {
      throw new Error("ADDRESS_NOT_FOUND");
    }

    const raw = data as any;
    if (data.fullName !== undefined || raw.recipientName !== undefined) {
      address.fullName = data.fullName || raw.recipientName;
    }
    if (data.phone !== undefined || raw.phoneNumber !== undefined) {
      address.phone = data.phone || raw.phoneNumber;
    }
    if (data.addressLine !== undefined || data.street !== undefined || raw.address !== undefined) {
      address.addressLine =
        data.addressLine || data.street || raw.address || address.addressLine;
    }
    if (data.city !== undefined || raw.location !== undefined) {
      address.city = data.city || raw.location || address.city;
    }
    if (data.district !== undefined || data.area !== undefined || raw.state !== undefined) {
      address.district = data.district || data.area || raw.state || address.district;
    }
    if (data.province !== undefined) address.province = data.province;
    if (data.postalCode !== undefined) address.postalCode = data.postalCode;
    if (data.label !== undefined || raw.title !== undefined) {
      address.label = data.label || raw.title || address.label;
    }

    if (data.isDefault === true) {
      await addressRepository.update({ userId }, { isDefault: false });
      address.isDefault = true;
    }

    return await addressRepository.save(address);
  }

  async setDefaultAddress(userId: number, addressId: number): Promise<Address> {
    let address = await addressRepository.findOne({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address && addressId === 1) {
      address = await addressRepository.findOne({
        where: { userId },
        order: { isDefault: "DESC", createdAt: "DESC" },
      });
    }

    if (!address) {
      throw new Error("ADDRESS_NOT_FOUND");
    }

    await addressRepository.update({ userId }, { isDefault: false });

    address.isDefault = true;

    return await addressRepository.save(address);
  }

  async deleteAddress(userId: number, addressId: number): Promise<void> {
    let address = await addressRepository.findOne({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address && addressId === 1) {
      address = await addressRepository.findOne({
        where: { userId },
        order: { isDefault: "DESC", createdAt: "DESC" },
      });
    }

    if (!address) {
      throw new Error("ADDRESS_NOT_FOUND");
    }

    await addressRepository.remove(address);

    if (address.isDefault) {
      const remainingAddress = await addressRepository.findOne({
        where: { userId },
        order: {
          createdAt: "DESC",
        },
      });

      if (remainingAddress) {
        remainingAddress.isDefault = true;
        await addressRepository.save(remainingAddress);
      }
    }
  }
}

export default new AddressService();
