import { DataSource } from "typeorm";
import {
  lifestyleCollectionRepository,
  productLifestyleRepository,
  productRepository,
} from "../repository";
import { LifestyleCollection } from "../entities/lifestyle-collection.entity";
import { ProductLifestyle } from "../entities/product-lifestyle.entity";
import { Product } from "../entities/product.entity";

export interface LifestyleCollectionDTO {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  icon: string;
  subcategories: string[];
  displayOrder: number;
  isActive: number;
  productCount: number;
}

export interface CollectionProductsQuery {
  search?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

const DEFAULT_COLLECTIONS = [
  {
    id: "lifestyle-furniture",
    name: "Furniture",
    slug: "furniture",
    description:
      "Handcrafted wooden furniture, comfortable seating, and timeless home furnishings made by Nepali artisans.",
    image:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=80",
    icon: "furniture",
    subcategories: [
      "Sofas",
      "Beds",
      "Tables",
      "Chairs",
      "Wardrobes",
      "Cabinets",
      "Shelves",
      "Storage Furniture",
    ],
    displayOrder: 1,
  },
  {
    id: "lifestyle-home-living",
    name: "Home & Living",
    slug: "home-living",
    description:
      "Transform your living spaces with authentic handwoven rugs, radiant lighting, decorative cushions, and wall art.",
    image:
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80",
    icon: "home",
    subcategories: [
      "Home Decor",
      "Curtains",
      "Rugs",
      "Cushions",
      "Lighting",
      "Wall Decor",
    ],
    displayOrder: 2,
  },
  {
    id: "lifestyle-kitchen-dining",
    name: "Kitchen & Dining",
    slug: "kitchen-dining",
    description:
      "Traditional brass cookware, ceramic dinnerware, organic kitchen storage, and dining essentials.",
    image:
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=80",
    icon: "kitchen",
    subcategories: [
      "Cookware",
      "Kitchen Utensils",
      "Dinnerware",
      "Kitchen Storage",
      "Dining Accessories",
      "Appliances",
    ],
    displayOrder: 3,
  },
  {
    id: "lifestyle-garden-outdoor",
    name: "Garden & Outdoor",
    slug: "garden-outdoor",
    description:
      "Nurture your outdoor sanctuary with terracotta planters, indigenous plants, gardening tools, and patio furniture.",
    image:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1000&q=80",
    icon: "garden",
    subcategories: [
      "Plants",
      "Plant Pots",
      "Gardening Tools",
      "Outdoor Furniture",
      "Outdoor Accessories",
    ],
    displayOrder: 4,
  },
  {
    id: "lifestyle-beauty-personal-care",
    name: "Beauty & Personal Care",
    slug: "beauty-personal-care",
    description:
      "Himalayan herbal skincare, organic soaps, botanical haircare, and natural wellness therapies.",
    image:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=80",
    icon: "beauty",
    subcategories: [
      "Skincare",
      "Haircare",
      "Personal Care",
      "Beauty Accessories",
      "Grooming",
    ],
    displayOrder: 5,
  },
  {
    id: "lifestyle-fashion-accessories",
    name: "Fashion & Accessories",
    slug: "fashion-accessories",
    description:
      "Handcrafted cashmere shawls, organic hemp bags, traditional Dhaka textiles, and artisanal jewelry.",
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1000&q=80",
    icon: "fashion",
    subcategories: [
      "Clothing",
      "Bags",
      "Shoes",
      "Watches",
      "Jewelry",
      "Accessories",
    ],
    displayOrder: 6,
  },
];

const INITIAL_LIFESTYLE_PRODUCTS = [
  // Furniture
  {
    id: "PROD-FURN-01",
    name: "Handcrafted Sisau Wood Dining Table",
    category: "Furniture",
    subcategory: "Tables",
    lifestyleId: "lifestyle-furniture",
    price: 32500,
    weight: "35 kg (Net Weight)",
    sellingUnit: "piece",
    allowDecimals: 0,
    rating: 4.9,
    sold: "14",
    origin: "Bhaktapur, Nepal",
    seller: "Newa Woodcrafts",
    stock: 8,
    image: "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=800&q=80",
    description: "Solid Dalbergia sissoo (Sisau) hardwood dining table with rustic matte wax finish.",
  },
  {
    id: "PROD-FURN-02",
    name: "Traditional Bamboo Armchair & Cushion Set",
    category: "Furniture",
    subcategory: "Chairs",
    lifestyleId: "lifestyle-furniture",
    price: 4800,
    weight: "7 kg (Net Weight)",
    sellingUnit: "set",
    allowDecimals: 0,
    rating: 4.7,
    sold: "29",
    origin: "Chitwan, Nepal",
    seller: "Terai Cane Crafts",
    stock: 15,
    image: "https://images.unsplash.com/photo-1580481077195-c3a821a5060f?auto=format&fit=crop&w=800&q=80",
    description: "Hand-bent natural bamboo armchair with handwoven cotton padding.",
  },
  {
    id: "PROD-FURN-03",
    name: "Carved Wooden 4-Tier Display Shelf",
    category: "Furniture",
    subcategory: "Shelves",
    lifestyleId: "lifestyle-furniture",
    price: 14200,
    weight: "18 kg (Net Weight)",
    sellingUnit: "piece",
    allowDecimals: 0,
    rating: 4.8,
    sold: "9",
    origin: "Lalitpur, Nepal",
    seller: "Patan Heritage Wood",
    stock: 6,
    image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=80",
    description: "Traditional Nepali floral engravings on durable pine and sal wood.",
  },

  // Home & Living
  {
    id: "PROD-HOME-01",
    name: "Handwoven Bhaktapur Sukul Grass Rug",
    category: "Home & Living",
    subcategory: "Rugs",
    lifestyleId: "lifestyle-home-living",
    price: 2200,
    weight: "3 kg (Net Weight)",
    sellingUnit: "piece",
    allowDecimals: 0,
    rating: 4.8,
    sold: "45",
    origin: "Bhaktapur, Nepal",
    seller: "Sukul Weavers Co-op",
    stock: 25,
    image: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80",
    description: "100% natural straw and jute handwoven floor mat offering natural thermal insulation.",
  },
  {
    id: "PROD-HOME-02",
    name: "Handcrafted Brass Diyo Oil Lamp",
    category: "Home & Living",
    subcategory: "Lighting",
    lifestyleId: "lifestyle-home-living",
    price: 1850,
    weight: "1.2 kg",
    sellingUnit: "piece",
    allowDecimals: 0,
    rating: 4.9,
    sold: "78",
    origin: "Patan, Nepal",
    seller: "Patan Metal Artisans",
    stock: 30,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
    description: "Pure spun yellow brass oil lamp with traditional lotus peacock motif.",
  },
  {
    id: "PROD-HOME-03",
    name: "Mithila Art Peacock Wall Hanging Tapestry",
    category: "Home & Living",
    subcategory: "Wall Decor",
    lifestyleId: "lifestyle-home-living",
    price: 3400,
    weight: "800 g",
    sellingUnit: "piece",
    allowDecimals: 0,
    rating: 5.0,
    sold: "22",
    origin: "Janakpur, Nepal",
    seller: "Mithila Women Collective",
    stock: 12,
    image: "https://images.unsplash.com/photo-1582561424760-0321d75e81fa?auto=format&fit=crop&w=800&q=80",
    description: "Authentic hand-painted canvas depicting peacock symbols of prosperity.",
  },

  // Kitchen & Dining
  {
    id: "PROD-KITCH-01",
    name: "Traditional Palpa Cast Bronze Kasa Bowl",
    category: "Kitchen & Dining",
    subcategory: "Dinnerware",
    lifestyleId: "lifestyle-kitchen-dining",
    price: 2900,
    weight: "950 g",
    sellingUnit: "piece",
    allowDecimals: 0,
    rating: 4.9,
    sold: "38",
    origin: "Palpa, Nepal",
    seller: "Tansen Kasa Bhaada",
    stock: 20,
    image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80",
    description: "Authentic bell-metal kasa bowl hand-hammered for health benefits and long heat retention.",
  },
  {
    id: "PROD-KITCH-02",
    name: "Himalayan Pink Salt Mortar & Pestle",
    category: "Kitchen & Dining",
    subcategory: "Kitchen Utensils",
    lifestyleId: "lifestyle-kitchen-dining",
    price: 1450,
    weight: "2.1 kg",
    sellingUnit: "set",
    allowDecimals: 0,
    rating: 4.7,
    sold: "53",
    origin: "Mustang, Nepal",
    seller: "Himalayan Stone Works",
    stock: 18,
    image: "https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=800&q=80",
    description: "Carved from natural mineral rock for crushing spices and making garlic paste.",
  },
  {
    id: "PROD-KITCH-03",
    name: "Handmade Terracotta Water Pitcher (Matka)",
    category: "Kitchen & Dining",
    subcategory: "Kitchen Storage",
    lifestyleId: "lifestyle-kitchen-dining",
    price: 850,
    weight: "1.8 kg",
    sellingUnit: "piece",
    allowDecimals: 0,
    rating: 4.8,
    sold: "64",
    origin: "Thimi, Bhaktapur",
    seller: "Pottery Square Crafts",
    stock: 40,
    image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
    description: "Natural clay water carafe offering natural micro-evaporation water cooling.",
  },

  // Garden & Outdoor
  {
    id: "PROD-GARD-01",
    name: "Handcrafted Terracotta Herb Planter Pots (Set of 3)",
    category: "Garden & Outdoor",
    subcategory: "Plant Pots",
    lifestyleId: "lifestyle-garden-outdoor",
    price: 650,
    weight: "2.5 kg",
    sellingUnit: "set",
    allowDecimals: 0,
    rating: 4.8,
    sold: "82",
    origin: "Thimi, Nepal",
    seller: "Pottery Square Crafts",
    stock: 35,
    image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=80",
    description: "Breathable terracotta clay pots with drainage trays, ideal for balcony gardens.",
  },
  {
    id: "PROD-GARD-02",
    name: "Organic Sacred Nepali Tulsi (Holy Basil) Plant",
    category: "Garden & Outdoor",
    subcategory: "Plants",
    lifestyleId: "lifestyle-garden-outdoor",
    price: 350,
    weight: "1.2 kg",
    sellingUnit: "piece",
    allowDecimals: 0,
    rating: 4.9,
    sold: "110",
    origin: "Godavari, Lalitpur",
    seller: "Green Mountain Nursery",
    stock: 50,
    image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80",
    description: "Aromatic Rama Tulsi potted in enriched compost soil.",
  },
  {
    id: "PROD-GARD-03",
    name: "Forged Iron Hand Weeding Hoe & Trowel",
    category: "Garden & Outdoor",
    subcategory: "Gardening Tools",
    lifestyleId: "lifestyle-garden-outdoor",
    price: 1200,
    weight: "900 g",
    sellingUnit: "set",
    allowDecimals: 0,
    rating: 4.6,
    sold: "31",
    origin: "Bhojpur, Nepal",
    seller: "Bhojpur Smith Guild",
    stock: 22,
    image: "https://images.unsplash.com/photo-1617576683096-00fc8eecb3af?auto=format&fit=crop&w=800&q=80",
    description: "Hand-forged carbon steel gardening tool with turned wood handle.",
  },

  // Beauty & Personal Care
  {
    id: "PROD-BEAU-01",
    name: "Himalayan Wild Nettle (Allo) Artisan Herbal Soap",
    category: "Beauty & Personal Care",
    subcategory: "Personal Care",
    lifestyleId: "lifestyle-beauty-personal-care",
    price: 320,
    weight: "125 g",
    sellingUnit: "piece",
    allowDecimals: 0,
    rating: 4.9,
    sold: "140",
    origin: "Sankhuwasabha, Nepal",
    seller: "Himalayan Organics",
    stock: 65,
    image: "https://images.unsplash.com/photo-1607006314180-30514931a547?auto=format&fit=crop&w=800&q=80",
    description: "Cold-processed soap infused with wild nettle, virgin coconut oil, and lemongrass.",
  },
  {
    id: "PROD-BEAU-02",
    name: "Pure Wild Juniper & Rosemary Scalp Treatment Oil",
    category: "Beauty & Personal Care",
    subcategory: "Haircare",
    lifestyleId: "lifestyle-beauty-personal-care",
    price: 950,
    weight: "100 ml",
    sellingUnit: "piece",
    allowDecimals: 0,
    rating: 4.8,
    sold: "58",
    origin: "Humla, Nepal",
    seller: "High Mountain Aromatics",
    stock: 28,
    image: "https://images.unsplash.com/photo-1608248597359-5f284e37508e?auto=format&fit=crop&w=800&q=80",
    description: "Stimulating hair root oil steam-distilled from wild high-altitude juniper needles.",
  },
  {
    id: "PROD-BEAU-03",
    name: "Organic Turmeric & Sandalwood Herbal Face Ubtan",
    category: "Beauty & Personal Care",
    subcategory: "Skincare",
    lifestyleId: "lifestyle-beauty-personal-care",
    price: 780,
    weight: "150 g",
    sellingUnit: "piece",
    allowDecimals: 0,
    rating: 4.9,
    sold: "92",
    origin: "Palpa, Nepal",
    seller: "Vedic Beauty Co.",
    stock: 35,
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
    description: "Ayurvedic brightening face polish made of Kasturi turmeric, chickpea flour, and sandalwood.",
  },

  // Fashion & Accessories
  {
    id: "PROD-FASH-01",
    name: "Handspun Pure Pashmina Cashmere Shawl",
    category: "Fashion & Accessories",
    subcategory: "Clothing",
    lifestyleId: "lifestyle-fashion-accessories",
    price: 8500,
    weight: "180 g",
    sellingUnit: "piece",
    allowDecimals: 0,
    rating: 5.0,
    sold: "41",
    origin: "Chyangra, Mustang",
    seller: "Himalayan Pashmina Guild",
    stock: 14,
    image: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&w=800&q=80",
    description: "Ultra-fine hand-combed mountain goat cashmere woven on traditional wooden handlooms.",
  },
  {
    id: "PROD-FASH-02",
    name: "Organic Himalayan Wild Hemp City Daypack",
    category: "Fashion & Accessories",
    subcategory: "Bags",
    lifestyleId: "lifestyle-fashion-accessories",
    price: 2600,
    weight: "650 g",
    sellingUnit: "piece",
    allowDecimals: 0,
    rating: 4.8,
    sold: "75",
    origin: "Bajhang, Nepal",
    seller: "Hemp Craft Co.",
    stock: 25,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    description: "Durable, eco-friendly unbleached natural wild hemp backpack with YKK brass zippers.",
  },
  {
    id: "PROD-FASH-03",
    name: "Traditional Palpali Handwoven Dhaka Scarf",
    category: "Fashion & Accessories",
    subcategory: "Accessories",
    lifestyleId: "lifestyle-fashion-accessories",
    price: 1400,
    weight: "220 g",
    sellingUnit: "piece",
    allowDecimals: 0,
    rating: 4.7,
    sold: "60",
    origin: "Tansen, Palpa",
    seller: "Palpali Dhaka Weavers",
    stock: 30,
    image: "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?auto=format&fit=crop&w=800&q=80",
    description: "Geometric handcrafted Dhaka motifs in vibrant natural cotton dyes.",
  },
  {
    id: "PROD-FASH-04",
    name: "Classic Organic Cotton T-Shirt",
    category: "Fashion & Accessories",
    subcategory: "Clothing",
    lifestyleId: "lifestyle-fashion-accessories",
    price: 800,
    weight: "200 g",
    sellingUnit: "piece",
    allowDecimals: 0,
    rating: 4.9,
    sold: "120",
    origin: "Kathmandu, Nepal",
    seller: "EcoWeave Nepal",
    stock: 45,
    variantsJson: JSON.stringify([
      { id: "var-s", name: "Small", optionType: "Size", price: 800, stock: 12 },
      { id: "var-m", name: "Medium", optionType: "Size", price: 800, stock: 20 },
      { id: "var-l", name: "Large", optionType: "Size", price: 800, stock: 13 },
    ]),
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
    description: "100% certified organic soft ring-spun breathable cotton T-shirt with reinforced crew neck.",
  },
  {
    id: "PROD-FASH-05",
    name: "Handmade Trail Walking Shoes",
    category: "Fashion & Accessories",
    subcategory: "Shoes",
    lifestyleId: "lifestyle-fashion-accessories",
    price: 2500,
    weight: "750 g",
    sellingUnit: "pair",
    allowDecimals: 0,
    rating: 4.8,
    sold: "52",
    origin: "Pokhara, Nepal",
    seller: "Annapurna Footwear",
    stock: 24,
    variantsJson: JSON.stringify([
      { id: "var-40", name: "Size 40", optionType: "Size", price: 2500, stock: 8 },
      { id: "var-41", name: "Size 41", optionType: "Size", price: 2500, stock: 10 },
      { id: "var-42", name: "Size 42", optionType: "Size", price: 2500, stock: 6 },
    ]),
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    description: "Comfortable ergonomic trail walking shoes crafted from durable canvas and recycled rubber grip soles.",
  },
];

export class LifestyleService {
  async initLifestyleTables(dataSource: DataSource): Promise<void> {
    try {
      await dataSource.query(`
        CREATE TABLE IF NOT EXISTS lifestyle_collections (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          image VARCHAR(500) DEFAULT '',
          icon VARCHAR(100) DEFAULT '',
          subcategories_json TEXT,
          display_order INT DEFAULT 0,
          is_active INT DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
      `);

      await dataSource.query(`
        CREATE TABLE IF NOT EXISTS product_lifestyles (
          product_id VARCHAR(100) NOT NULL,
          lifestyle_id VARCHAR(100) NOT NULL,
          subcategory VARCHAR(100) NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (product_id, lifestyle_id),
          INDEX idx_lifestyle_id (lifestyle_id),
          INDEX idx_product_id (product_id)
        );
      `);

      // Check if collections exist
      const existingCollections: any[] = await dataSource.query(
        "SELECT COUNT(*) as count FROM lifestyle_collections"
      );
      const count = parseInt(existingCollections[0]?.count || "0", 10);

      if (count === 0) {
        for (const col of DEFAULT_COLLECTIONS) {
          await dataSource.query(
            `INSERT INTO lifestyle_collections 
              (id, name, slug, description, image, icon, subcategories_json, display_order, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
              col.id,
              col.name,
              col.slug,
              col.description,
              col.image,
              col.icon,
              JSON.stringify(col.subcategories),
              col.displayOrder,
            ]
          );
        }
      }

      // Ensure lifestyle products exist and have correct selling units & mappings
      for (const p of INITIAL_LIFESTYLE_PRODUCTS) {
        const existingProd: any[] = await dataSource.query(
          "SELECT id FROM products WHERE id = ?",
          [p.id]
        );

        if (existingProd.length === 0) {
          await dataSource.query(
            `INSERT INTO products 
              (id, name, category, weight, selling_unit, allow_decimals, variants_json, price, rating, sold, origin, seller, image, stock, active, description)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
            [
              p.id,
              p.name,
              p.category,
              p.weight,
              (p as any).sellingUnit || "piece",
              (p as any).allowDecimals ?? 0,
              (p as any).variantsJson || null,
              p.price,
              p.rating,
              p.sold,
              p.origin,
              p.seller,
              p.image,
              p.stock,
              p.description,
            ]
          );
        } else {
          await dataSource.query(
            `UPDATE products 
             SET selling_unit = ?, allow_decimals = ?, variants_json = COALESCE(?, variants_json)
             WHERE id = ?`,
            [(p as any).sellingUnit || "piece", (p as any).allowDecimals ?? 0, (p as any).variantsJson || null, p.id]
          );
        }

        // Insert into product_lifestyles
        await dataSource.query(
          `INSERT IGNORE INTO product_lifestyles (product_id, lifestyle_id, subcategory)
           VALUES (?, ?, ?)`,
          [p.id, p.lifestyleId, p.subcategory]
        );
      }
    } catch (error) {
      console.error("Failed to initialize lifestyle tables:", error);
    }
  }

  async getCollections(includeInactive = false): Promise<LifestyleCollectionDTO[]> {
    const qb = lifestyleCollectionRepository.createQueryBuilder("c");
    if (!includeInactive) {
      qb.where("c.isActive = 1");
    }
    qb.orderBy("c.displayOrder", "ASC");
    const collections = await qb.getMany();

    // Get product counts per lifestyle collection
    const countsRaw: { lifestyle_id: string; count: string }[] =
      await productLifestyleRepository
        .createQueryBuilder("pl")
        .innerJoin(Product, "p", "p.id = pl.product_id AND p.active = 1")
        .select("pl.lifestyle_id", "lifestyle_id")
        .addSelect("COUNT(pl.product_id)", "count")
        .groupBy("pl.lifestyle_id")
        .getRawMany();

    const countMap = new Map<string, number>();
    for (const r of countsRaw) {
      countMap.set(r.lifestyle_id, parseInt(r.count, 10) || 0);
    }

    return collections.map((col) => {
      let subcategories: string[] = [];
      if (col.subcategoriesJson) {
        try {
          subcategories = JSON.parse(col.subcategoriesJson);
        } catch {
          subcategories = [];
        }
      }

      return {
        id: col.id,
        name: col.name,
        slug: col.slug,
        description: col.description || "",
        image: col.image || "",
        icon: col.icon || "",
        subcategories,
        displayOrder: col.displayOrder,
        isActive: col.isActive,
        productCount: countMap.get(col.id) || 0,
      };
    });
  }

  async getCollectionBySlug(
    slug: string
  ): Promise<LifestyleCollectionDTO | null> {
    const col = await lifestyleCollectionRepository.findOne({
      where: { slug },
    });

    if (!col) {
      return null;
    }

    const countRaw: { count: string } | undefined =
      await productLifestyleRepository
        .createQueryBuilder("pl")
        .innerJoin(Product, "p", "p.id = pl.product_id AND p.active = 1")
        .select("COUNT(pl.product_id)", "count")
        .where("pl.lifestyle_id = :id", { id: col.id })
        .getRawOne();

    let subcategories: string[] = [];
    if (col.subcategoriesJson) {
      try {
        subcategories = JSON.parse(col.subcategoriesJson);
      } catch {
        subcategories = [];
      }
    }

    return {
      id: col.id,
      name: col.name,
      slug: col.slug,
      description: col.description || "",
      image: col.image || "",
      icon: col.icon || "",
      subcategories,
      displayOrder: col.displayOrder,
      isActive: col.isActive,
      productCount: parseInt(countRaw?.count || "0", 10),
    };
  }

  async getCollectionProducts(
    slug: string,
    query: CollectionProductsQuery = {}
  ): Promise<{
    collection: LifestyleCollectionDTO;
    products: (Product & { subcategory?: string | null })[];
    total: number;
    page: number;
    totalPages: number;
    subcategories: string[];
  }> {
    const collection = await this.getCollectionBySlug(slug);
    if (!collection) {
      throw new Error("LIFESTYLE_NOT_FOUND");
    }

    const qb = productRepository
      .createQueryBuilder("product")
      .innerJoin(
        ProductLifestyle,
        "pl",
        "pl.product_id = product.id AND pl.lifestyle_id = :lifestyleId",
        { lifestyleId: collection.id }
      )
      .addSelect("pl.subcategory", "pl_subcategory")
      .where("product.active = 1");

    if (query.subcategory && query.subcategory !== "all") {
      qb.andWhere("LOWER(pl.subcategory) = LOWER(:subcat)", {
        subcat: query.subcategory,
      });
    }

    if (query.search) {
      qb.andWhere(
        "(LOWER(product.name) LIKE LOWER(:search) OR LOWER(product.description) LIKE LOWER(:search) OR LOWER(product.origin) LIKE LOWER(:search))",
        { search: `%${query.search}%` }
      );
    }

    if (query.minPrice !== undefined && !isNaN(query.minPrice)) {
      qb.andWhere("product.price >= :minPrice", { minPrice: query.minPrice });
    }

    if (query.maxPrice !== undefined && !isNaN(query.maxPrice)) {
      qb.andWhere("product.price <= :maxPrice", { maxPrice: query.maxPrice });
    }

    // Sort order
    if (query.sort === "price-asc" || query.sort === "price_asc") {
      qb.orderBy("product.price", "ASC");
    } else if (query.sort === "price-desc" || query.sort === "price_desc") {
      qb.orderBy("product.price", "DESC");
    } else if (query.sort === "rating") {
      qb.orderBy("product.rating", "DESC");
    } else if (query.sort === "newest" || query.sort === "latest") {
      qb.orderBy("product.createdAt", "DESC").addOrderBy("product.id", "DESC");
    } else {
      // Default: popular
      qb.orderBy("product.rating", "DESC").addOrderBy("product.id", "ASC");
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(query.limit) || 12));
    const skip = (page - 1) * limit;

    const [rawEntities, total] = await Promise.all([
      qb.offset(skip).limit(limit).getRawAndEntities(),
      qb.getCount(),
    ]);

    const products = rawEntities.entities.map((p, idx) => {
      const sub = rawEntities.raw[idx]?.pl_subcategory || null;
      return {
        ...p,
        subcategory: sub,
      };
    });

    return {
      collection,
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      subcategories: collection.subcategories,
    };
  }

  async getProductLifestyles(productId: string): Promise<
    { lifestyleId: string; subcategory: string | null }[]
  > {
    try {
      const records = await productLifestyleRepository.find({
        where: { productId },
      });
      return records.map((r) => ({
        lifestyleId: r.lifestyleId,
        subcategory: r.subcategory,
      }));
    } catch {
      return [];
    }
  }

  async assignProductLifestyles(
    productId: string,
    assignments: { lifestyleId: string; subcategory?: string | null }[]
  ): Promise<void> {
    try {
      // Delete existing assignments for this product
      await productLifestyleRepository.delete({ productId });

      if (!assignments || assignments.length === 0) {
        return;
      }

      const entries = assignments.map((a) =>
        productLifestyleRepository.create({
          productId,
          lifestyleId: a.lifestyleId,
          subcategory: a.subcategory || null,
        })
      );

      await productLifestyleRepository.save(entries);
    } catch (e) {
      console.error("assignProductLifestyles error:", e);
    }
  }

  /* Admin Management */
  async createCollection(body: {
    name: string;
    slug?: string;
    description?: string;
    image?: string;
    icon?: string;
    subcategories?: string[];
    displayOrder?: number;
    isActive?: number;
  }): Promise<LifestyleCollectionDTO> {
    const slug = (body.slug || body.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const id = `lifestyle-${slug}`;
    const newCol = lifestyleCollectionRepository.create({
      id,
      name: body.name.trim(),
      slug,
      description: body.description?.trim() || "",
      image: body.image?.trim() || "",
      icon: body.icon?.trim() || "",
      subcategoriesJson: JSON.stringify(body.subcategories || []),
      displayOrder: Number(body.displayOrder) || 0,
      isActive: body.isActive !== undefined ? Number(body.isActive) : 1,
    });

    await lifestyleCollectionRepository.save(newCol);
    return (await this.getCollectionBySlug(slug))!;
  }

  async updateCollection(
    id: string,
    body: Partial<{
      name: string;
      slug: string;
      description: string;
      image: string;
      icon: string;
      subcategories: string[];
      displayOrder: number;
      isActive: number;
    }>
  ): Promise<LifestyleCollectionDTO> {
    const col = await lifestyleCollectionRepository.findOne({ where: { id } });
    if (!col) {
      throw new Error("LIFESTYLE_NOT_FOUND");
    }

    if (body.name) col.name = body.name.trim();
    if (body.slug) col.slug = body.slug.trim();
    if (body.description !== undefined) col.description = body.description.trim();
    if (body.image !== undefined) col.image = body.image.trim();
    if (body.icon !== undefined) col.icon = body.icon.trim();
    if (body.subcategories) col.subcategoriesJson = JSON.stringify(body.subcategories);
    if (body.displayOrder !== undefined) col.displayOrder = Number(body.displayOrder);
    if (body.isActive !== undefined) col.isActive = Number(body.isActive);

    await lifestyleCollectionRepository.save(col);
    return (await this.getCollectionBySlug(col.slug))!;
  }

  async toggleCollectionStatus(id: string): Promise<LifestyleCollectionDTO> {
    const col = await lifestyleCollectionRepository.findOne({ where: { id } });
    if (!col) {
      throw new Error("LIFESTYLE_NOT_FOUND");
    }
    col.isActive = col.isActive === 1 ? 0 : 1;
    await lifestyleCollectionRepository.save(col);
    return (await this.getCollectionBySlug(col.slug))!;
  }

  async deleteCollection(id: string): Promise<void> {
    await productLifestyleRepository.delete({ lifestyleId: id });
    await lifestyleCollectionRepository.delete({ id });
  }
}

export default new LifestyleService();
