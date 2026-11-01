import { productRepository } from "../repository";
import { Product } from "../entities/product.entity";

export interface PlaceSummary {
  id: string;
  name: string;
  origin: string;
  district: string;
  productsCount: number;
  totalSold: number;
  image: string;
  description: string;
}

export class PlaceService {
  async getPlaces(): Promise<PlaceSummary[]> {
    const products = await productRepository.find({
      where: { active: 1 },
      order: { origin: "ASC" },
    });

    const placeMap = new Map<string, { products: Product[]; totalSold: number }>();

    for (const p of products) {
      const origin = p.origin ? p.origin.trim() : "Nepal";
      if (!placeMap.has(origin)) {
        placeMap.set(origin, { products: [], totalSold: 0 });
      }
      const entry = placeMap.get(origin)!;
      entry.products.push(p);
      const soldNum = parseInt(String(p.sold).replace(/[^\d]/g, ""), 10) || 0;
      entry.totalSold += soldNum;
    }

    const places: PlaceSummary[] = [];

    for (const [origin, entry] of placeMap.entries()) {
      const name = origin.split(",")[0].trim();
      const slug = name.toLowerCase().replace(/\s+/g, "-");

      places.push({
        id: slug,
        name,
        origin,
        district: name,
        productsCount: entry.products.length,
        totalSold: entry.totalSold,
        image: `/src/frontend/assets/images/places/${slug}.jpg`,
        description: `Direct harvest of authentic farm produce cultivated in the fertile soils of ${name}, Nepal.`,
      });
    }

    return places.sort((a, b) => b.productsCount - a.productsCount || a.name.localeCompare(b.name));
  }

  async getPlaceById(idOrSlug: string): Promise<{ place: PlaceSummary; products: Product[] } | null> {
    const places = await this.getPlaces();
    const found = places.find(
      (p) =>
        p.id.toLowerCase() === idOrSlug.toLowerCase() ||
        p.name.toLowerCase() === idOrSlug.toLowerCase()
    );

    if (!found) {
      return null;
    }

    const products = await productRepository.find({
      where: { origin: found.origin, active: 1 },
      order: { id: "ASC" },
    });

    return {
      place: found,
      products,
    };
  }
}

export default new PlaceService();
