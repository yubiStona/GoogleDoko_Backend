import { couponRepository } from "../repository";

export interface OfferBanner {
  id: number;
  title: string;
  description: string;
  buttonText: string;
  image: string;
  theme: "green" | "yellow" | "blue" | "orange";
  to: string;
  badge?: string;
  code?: string;
}

export class OfferService {
  async getOffers(): Promise<{ banners: OfferBanner[]; activeCoupons: any[] }> {
    const coupons = await couponRepository.find({
      where: { active: 1 },
      order: { createdAt: "DESC" },
    });

    const banners: OfferBanner[] = [
      {
        id: 1,
        title: "Explore by Places",
        description: "Fresh picks from local farmers near you across Nepal",
        buttonText: "Explore Now",
        image: "/src/frontend/assets/images/offers/explore-places-hd.png",
        theme: "green",
        to: "/places",
        badge: "Local Farms",
      },
      {
        id: 2,
        title: "Popular Near You",
        description: "Top loved organic harvest picks in your area",
        buttonText: "Explore Now",
        image: "/src/frontend/assets/images/offers/popular-near-you-hd.png",
        theme: "yellow",
        to: "/shop",
        badge: coupons.length > 0 ? `Use code ${coupons[0].code}` : "Best Sellers",
        code: coupons.length > 0 ? coupons[0].code : undefined,
      },
      {
        id: 3,
        title: "Seasonal Products",
        description: "Handpicked mountain freshness for every season",
        buttonText: "Discover Now",
        image: "/src/frontend/assets/images/offers/seasonal-hd.png",
        theme: "blue",
        to: "/shop",
        badge: "Fresh Today",
      },
    ];

    const activeCoupons = coupons.map((c) => ({
      id: c.id,
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minOrder: c.minOrder,
      expiryDate: c.expiryDate,
      description:
        c.discountType === "percentage"
          ? `${c.discountValue}% off on orders above Rs. ${c.minOrder}`
          : `Rs. ${c.discountValue} flat off on orders above Rs. ${c.minOrder}`,
    }));

    return { banners, activeCoupons };
  }
}

export default new OfferService();
