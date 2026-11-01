import { productRepository } from "../repository";

export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description: string;
  productCount: number;
  image: string;
  theme: "orange" | "green" | "red" | "teal" | "yellow" | "blue" | "purple";
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
  Grains: {
    description: "Native Jumla Marsi rice, millet, and highland grains",
    image: "/src/frontend/assets/images/categories/grains.jpg",
    theme: "teal",
    icon: "grains",
  },
  Honey: {
    description: "Wild cliff and flora honey straight from hives",
    image: "/src/frontend/assets/images/categories/honey.jpg",
    theme: "orange",
    icon: "honey",
  },
};

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
        const meta = CATEGORY_META[name] || {
          description: "Fresh local produce from Nepalese farms",
          image: "/src/frontend/assets/images/categories/others.jpg",
          theme: "teal",
          icon: "others",
        };

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
