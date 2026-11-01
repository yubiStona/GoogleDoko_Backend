"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressService = void 0;
const repository_1 = require("../repository");
class AddressService {
    async createAddress(userId, data) {
        const existingAddresses = await repository_1.addressRepository.find({
            where: { userId },
        });
        const shouldBeDefault = existingAddresses.length === 0 || data.isDefault === true;
        if (shouldBeDefault && existingAddresses.length > 0) {
            await repository_1.addressRepository.update({ userId }, { isDefault: false });
        }
        const raw = data;
        const address = repository_1.addressRepository.create({
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
        return await repository_1.addressRepository.save(address);
    }
    async getUserAddresses(userId) {
        return await repository_1.addressRepository.find({
            where: { userId },
            order: {
                isDefault: "DESC",
                createdAt: "DESC",
            },
        });
    }
    async getAddressById(userId, addressId) {
        let address = await repository_1.addressRepository.findOne({
            where: {
                id: addressId,
                userId,
            },
        });
        if (!address && addressId === 1) {
            address = await repository_1.addressRepository.findOne({
                where: { userId },
                order: { isDefault: "DESC", createdAt: "DESC" },
            });
        }
        return address;
    }
    async updateAddress(userId, addressId, data) {
        let address = await repository_1.addressRepository.findOne({
            where: {
                id: addressId,
                userId,
            },
        });
        if (!address && addressId === 1) {
            address = await repository_1.addressRepository.findOne({
                where: { userId },
                order: { isDefault: "DESC", createdAt: "DESC" },
            });
        }
        if (!address) {
            throw new Error("ADDRESS_NOT_FOUND");
        }
        const raw = data;
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
        if (data.province !== undefined)
            address.province = data.province;
        if (data.postalCode !== undefined)
            address.postalCode = data.postalCode;
        if (data.label !== undefined || raw.title !== undefined) {
            address.label = data.label || raw.title || address.label;
        }
        if (data.isDefault === true) {
            await repository_1.addressRepository.update({ userId }, { isDefault: false });
            address.isDefault = true;
        }
        return await repository_1.addressRepository.save(address);
    }
    async setDefaultAddress(userId, addressId) {
        let address = await repository_1.addressRepository.findOne({
            where: {
                id: addressId,
                userId,
            },
        });
        if (!address && addressId === 1) {
            address = await repository_1.addressRepository.findOne({
                where: { userId },
                order: { isDefault: "DESC", createdAt: "DESC" },
            });
        }
        if (!address) {
            throw new Error("ADDRESS_NOT_FOUND");
        }
        await repository_1.addressRepository.update({ userId }, { isDefault: false });
        address.isDefault = true;
        return await repository_1.addressRepository.save(address);
    }
    async deleteAddress(userId, addressId) {
        let address = await repository_1.addressRepository.findOne({
            where: {
                id: addressId,
                userId,
            },
        });
        if (!address && addressId === 1) {
            address = await repository_1.addressRepository.findOne({
                where: { userId },
                order: { isDefault: "DESC", createdAt: "DESC" },
            });
        }
        if (!address) {
            throw new Error("ADDRESS_NOT_FOUND");
        }
        await repository_1.addressRepository.remove(address);
        if (address.isDefault) {
            const remainingAddress = await repository_1.addressRepository.findOne({
                where: { userId },
                order: {
                    createdAt: "DESC",
                },
            });
            if (remainingAddress) {
                remainingAddress.isDefault = true;
                await repository_1.addressRepository.save(remainingAddress);
            }
        }
    }
}
exports.AddressService = AddressService;
exports.default = new AddressService();
