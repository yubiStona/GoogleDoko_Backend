import { productRepository } from "../repository";

export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description: string;
  productCount: number;
  image: string;
  theme: "orange" | "green" | "red" | "teal" | "yellow" | "blue" | "purple" | "rose";
  icon: string;
}

const CATEGORY_META: Record<string, { description: string; image: string; theme: CategoryData["theme"]; icon: string }> = {
  Fruits: {
    description: "Fresh & juicy handpicked mountain fruits",
    image: "/src/frontend/assets/images/categories/fruits.jpg",
    theme: "orange",
    icon: "fruits",
  },
  Vegetables: {
    description: "Farm fresh organic vegetables from local valleys",
    image: "/src/frontend/assets/images/categories/vegetables.jpg",
    theme: "red",
    icon: "vegetables",
  },
  Spices: {
    description: "Aroma-rich authentic traditional Himalayan spices",
    image: "/src/frontend/assets/images/categories/spices.jpg",
    theme: "green",
    icon: "spices",
  },
  "Dairy & Eggs": {
    description: "Pure cow and yak dairy, fresh farm eggs",
    image: "/src/frontend/assets/images/categories/dairy.jpg",
    theme: "yellow",
    icon: "dairy",
  },
  "Beauty & Personal Care": {
    description: "Herbal skincare, organic soaps & natural wellness",
    image: "/src/frontend/assets/images/categories/beauty.jpg",
    theme: "rose",
    icon: "beauty",
  },
  "Fashion & Accessories": {
    description: "Authentic woolen shawls, apparel & handcrafted bags",
    image: "/src/frontend/assets/images/categories/fashion.jpg",
    theme: "blue",
    icon: "fashion",
  },
  Furniture: {
    description: "Handcrafted wooden chairs, tables & artisanal home furniture",
    image: "/src/frontend/assets/images/categories/furniture.jpg",
    theme: "teal",
    icon: "furniture",
  },
  "Home & Living": {
    description: "Handwoven rugs, bedsheets, cushions & ambient decor",
    image: "/src/frontend/assets/images/categories/home-living.jpg",
    theme: "purple",
    icon: "home",
  },
  "Kitchen & Dining": {
    description: "Traditional brassware, ceramic dinner sets & cookware",
    image: "/src/frontend/assets/images/categories/kitchen.jpg",
    theme: "orange",
    icon: "kitchen",
  },
  "Garden & Outdoor": {
    description: "Terracotta planters, Himalayan flora & outdoor essentials",
    image: "/src/frontend/assets/images/categories/garden.jpg",
    theme: "green",
    icon: "garden",
  },
  Grains: {
    description: "Native Jumla Marsi rice, millet, and highland grains",
    image: "/src/frontend/assets/images/categories/grains.jpg",
    theme: "yellow",
    icon: "grains",
  },
  Honey: {
    description: "Wild cliff and flora honey straight from hives",
    image: "/src/frontend/assets/images/categories/honey.jpg",
    theme: "orange",
    icon: "honey",
  },
  "Honey & Preserves": {
    description: "Wild cliff and flora honey straight from hives",
    image: "/src/frontend/assets/images/categories/honey.jpg",
    theme: "orange",
    icon: "honey",
  },
};

function resolveCategoryMeta(rawName: string) {
  if (CATEGORY_META[rawName]) {
    return CATEGORY_META[rawName];
  }
  const n = (rawName || "").toLowerCase().trim();
  for (const [key, val] of Object.entries(CATEGORY_META)) {
    if (key.toLowerCase() === n) return val;
  }
  if (n.includes("fruit")) return CATEGORY_META["Fruits"];
  if (n.includes("veg")) return CATEGORY_META["Vegetables"];
  if (n.includes("spice")) return CATEGORY_META["Spices"];
  if (n.includes("dairy") || n.includes("egg") || n.includes("milk")) return CATEGORY_META["Dairy & Eggs"];
  if (n.includes("beauty") || n.includes("care") || n.includes("skin")) return CATEGORY_META["Beauty & Personal Care"];
  if (n.includes("fashion") || n.includes("cloth") || n.includes("wear") || n.includes("shoe")) return CATEGORY_META["Fashion & Accessories"];
  if (n.includes("furnit") || n.includes("chair") || n.includes("table")) return CATEGORY_META["Furniture"];
  if (n.includes("home") || n.includes("living") || n.includes("decor") || n.includes("rug")) return CATEGORY_META["Home & Living"];
  if (n.includes("kitchen") || n.includes("dining") || n.includes("cook")) return CATEGORY_META["Kitchen & Dining"];
  if (n.includes("garden") || n.includes("outdoor") || n.includes("plant")) return CATEGORY_META["Garden & Outdoor"];
  if (n.includes("grain") || n.includes("rice") || n.includes("wheat") || n.includes("millet")) return CATEGORY_META["Grains"];
  if (n.includes("honey")) return CATEGORY_META["Honey"];

  return {
    description: "Fresh local produce & artisanal goods",
    image: "/src/frontend/assets/images/categories/others.jpg",
    theme: "teal" as CategoryData["theme"],
    icon: "others",
  };
}

export class CategoryService {
  async getCategories(): Promise<CategoryData[]> {
    const rawCategories: { category: string; count: string }[] = await productRepository
      .createQueryBuilder("product")
      .select("product.category", "category")
      .addSelect("COUNT(product.id)", "count")
      .where("product.active = 1")
      .groupBy("product.category")
      .getRawMany();

    const result: CategoryData[] = rawCategories
      .filter((row) => row.category && row.category.trim().length > 0)
      .map((row) => {
        const name = row.category.trim();
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const meta = resolveCategoryMeta(name);

        return {
          id: slug,
          name,
          slug,
          description: meta.description,
          productCount: parseInt(row.count, 10) || 0,
          image: meta.image,
          theme: meta.theme,
          icon: meta.icon,
        };
      });

    return result;
  }

  async getCategoryBySlug(slug: string): Promise<CategoryData | null> {
    const categories = await this.getCategories();
    return (
      categories.find(
        (c) => c.slug.toLowerCase() === slug.toLowerCase() || c.name.toLowerCase() === slug.toLowerCase()
      ) || null
    );
  }
}

export default new CategoryService();
