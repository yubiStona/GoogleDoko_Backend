import { contentRevisionRepository, homepageSectionRepository, settingRepository } from "../repository";

const defaults: Record<string, Record<string, unknown>> = {
  hero: {
    eyebrow: "Good food. Better choices. Local love.",
    title: "Welcome to GoogleDoko",
    description: "Discover local food and lifestyle products, all in one place.",
    backgroundImage: "/landing-assets/landing-background.jpg",
    imageAlt: "Himalayan foothills, local produce and Nepalese craft",
  },
  food: {
    eyebrow: "Fresh from Nepal", title: "Food with a place of origin.",
    description: "Shop farm fresh produce and traditional favourites from local growers.",
    button: "Explore food", image: "/landing-assets/food-card-scene.jpg",
    imageAlt: "Traditional Nepali food with a Himalayan hillside and temple", href: "/food",
  },
  lifestyle: {
    eyebrow: "Made to be lived with", title: "Bring local craft into your home.",
    description: "Find thoughtful home, fashion, and handmade goods from Nepalese makers.",
    button: "Explore lifestyle", image: "/landing-assets/lifestyle-card-scene.jpg",
    imageAlt: "Nepali handcrafted bag and home goods beside a mountain view", href: "/lifestyle-coming-soon",
  },
  special_offers: { title: "Special offers", description: "Seasonal picks and offers from local sellers.", image: "/landing-assets/offers.jpg", button: "Explore offers", href: "/shop" },
  how_it_works: { title: "How GoogleDoko works", description: "Shop local in a few simple steps.", step1Title: "Discover", step1Description: "Explore food and local places.", step2Title: "Choose", step2Description: "Pick products from trusted sellers.", step3Title: "Enjoy", step3Description: "Get your order delivered." },
  why_choose_us: { title: "Why choose GoogleDoko", description: "Good food, local makers, and thoughtful service.", item1Title: "Local first", item1Description: "Support producers across Nepal.", item2Title: "Chosen with care", item2Description: "Discover authentic local goods.", item3Title: "At your door", item3Description: "Simple delivery and support." },
  promo: { title: "A little more local", description: "Discover what is fresh and special this week.", image: "/landing-assets/promo.jpg", button: "Shop now", href: "/shop" },
  footer: { aboutTitle: "About GoogleDoko", aboutText: "Discover fresh, authentic and locally sourced products from across Nepal.", location: "Kathmandu, Nepal", phone: "+977 111-111-111", email: "support@googledoko.com", privacyLabel: "Privacy Policy", termsLabel: "Terms & Conditions" },
};

const allowedKeys = new Set(Object.keys(defaults));

function parsed(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === "object") return value as Record<string, unknown>;
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch { return null; }
  }
  return null;
}

function validateContent(key: string, content: Record<string, unknown>) {
  if (!allowedKeys.has(key)) throw new Error("INVALID_SECTION");
  const textFields = Object.keys(defaults[key]);
  for (const field of textFields) {
    const value = content[field];
    if (typeof value !== "string" || value.length > 2000) throw new Error(`INVALID_${field.toUpperCase()}`);
  }
  if ("href" in defaults[key]) {
    const href = content.href as string;
    if (!((href.startsWith("/") && !href.startsWith("//")) || /^https:\/\//i.test(href))) throw new Error("INVALID_DESTINATION");
  }
}

export class HomepageCmsService {
  async getAdminHomepage() {
    const [sections, settings] = await Promise.all([homepageSectionRepository.find({ order: { displayOrder: "ASC" } }), settingRepository.find()]);
    const settingMap = Object.fromEntries(settings.map((x) => [x.key, x.value]));
    return Object.entries(defaults).map(([key, fallback], index) => {
      const row = sections.find((section) => section.key === key);
    const legacyContent = key === "hero" ? {
        eyebrow: settingMap.landing_eyebrow || fallback.eyebrow,
        title: settingMap.landing_title || fallback.title,
        description: settingMap.landing_description || fallback.description,
        backgroundImage: settingMap.landing_background_image || fallback.backgroundImage,
        imageAlt: fallback.imageAlt,
      } : key === "food" ? {
        ...fallback,
        eyebrow: settingMap.landing_food_eyebrow || fallback.eyebrow,
        title: settingMap.landing_food_title || fallback.title,
        description: settingMap.landing_food_description || fallback.description,
        button: settingMap.landing_food_button || fallback.button,
        image: settingMap.landing_food_image || fallback.image,
      } : key === "lifestyle" ? {
        ...fallback,
        eyebrow: settingMap.landing_lifestyle_eyebrow || fallback.eyebrow,
        title: settingMap.landing_lifestyle_title || fallback.title,
        description: settingMap.landing_lifestyle_description || fallback.description,
        button: settingMap.landing_lifestyle_button || fallback.button,
        image: settingMap.landing_lifestyle_image || fallback.image,
      } : fallback;
      const published = parsed(row?.publishedContent) || legacyContent;
      return {
        key,
        draftContent: parsed(row?.draftContent) || published,
        publishedContent: published,
        publishedVisible: row?.publishedVisible ?? 1,
        draftVisible: row?.draftVisible ?? row?.publishedVisible ?? 1,
        displayOrder: row?.draftDisplayOrder ?? row?.displayOrder ?? index,
        status: row?.draftContent ? "draft" : "published",
        updatedAt: row?.updatedAt ?? null,
      };
    });
  }

  async getPublishedHomepage() {
    const rows = await homepageSectionRepository.find({ order: { displayOrder: "ASC" } });
    const settings = await settingRepository.find();
    const settingMap = Object.fromEntries(settings.map((x) => [x.key, x.value]));
    const lookup = new Map(rows.map((row) => [row.key, row]));
    const heroRow = lookup.get("hero");
    const foodRow = lookup.get("food");
    const lifestyleRow = lookup.get("lifestyle");
    const hero = parsed(heroRow?.publishedContent);
    const food = parsed(foodRow?.publishedContent);
    const lifestyle = parsed(lifestyleRow?.publishedContent);
    if (!rows.some((row) => row.publishedContent)) return null;
    const merge = (key: string, value: Record<string, unknown> | null, legacy: Record<string, unknown>) => {
      if (value) return value;
      const keys = key === "food" ? ["eyebrow", "title", "description", "button", "image"] : ["eyebrow", "title", "description", "button", "image"];
      const prefix = key === "food" ? "landing_food_" : "landing_lifestyle_";
      const result = { ...legacy };
      for (const field of keys) if (settingMap[prefix + field]) result[field] = settingMap[prefix + field];
      return result;
    };
    const contentByKey = Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => [key, parsed(lookup.get(key)?.publishedContent) || fallback]));
    const visibility = Object.fromEntries(Array.from(allowedKeys).map((key) => [key, lookup.get(key)?.publishedVisible ?? 1]));
    const displayOrder = Object.fromEntries(Array.from(allowedKeys).map((key, index) => [key, lookup.get(key)?.displayOrder ?? index]));
    return {
      eyebrow: hero?.eyebrow || settingMap.landing_eyebrow || defaults.hero.eyebrow,
      title: hero?.title || settingMap.landing_title || defaults.hero.title,
      description: hero?.description || settingMap.landing_description || defaults.hero.description,
      backgroundImage: hero?.backgroundImage || settingMap.landing_background_image || defaults.hero.backgroundImage,
      heroVisible: heroRow?.publishedVisible ?? 1,
      food: merge("food", food, defaults.food),
      foodVisible: foodRow?.publishedVisible ?? 1,
      lifestyle: merge("lifestyle", lifestyle, defaults.lifestyle),
      lifestyleVisible: lifestyleRow?.publishedVisible ?? 1,
      sections: contentByKey,
      visibility,
      displayOrder,
    };
  }

  async saveDraft(key: string, content: Record<string, unknown>, visible: boolean, displayOrder: number, adminId: number) {
    validateContent(key, content);
    const row = await homepageSectionRepository.findOne({ where: { key } });
    const previousDraft = parsed(row?.draftContent);
    const section = row || homepageSectionRepository.create({ key, draftContent: null, publishedContent: null, publishedVisible: 1, displayOrder, draftDisplayOrder: displayOrder, updatedBy: adminId });
    section.draftContent = content;
    section.draftVisible = visible ? 1 : 0;
    section.draftDisplayOrder = Math.max(0, Math.floor(displayOrder));
    section.updatedBy = adminId;
    await homepageSectionRepository.save(section);
    await contentRevisionRepository.save(contentRevisionRepository.create({
      recordType: "homepage_section", recordKey: key, action: "draft_saved",
      previousContent: previousDraft,
      newContent: { content, visible: section.draftVisible, displayOrder: section.draftDisplayOrder },
      adminUserId: adminId,
    }));
    return { key, draftContent: content, displayOrder: section.draftDisplayOrder, draftVisible: visible, status: "draft" };
  }

  async publish(key: string, adminId: number) {
    if (!allowedKeys.has(key)) throw new Error("INVALID_SECTION");
    const section = await homepageSectionRepository.findOne({ where: { key } });
    if (!section?.draftContent) throw new Error("NO_DRAFT");
    const previous = { content: parsed(section.publishedContent), visible: section.publishedVisible, displayOrder: section.displayOrder };
    const nextVisible = section.draftVisible;
    section.publishedContent = parsed(section.draftContent);
    section.publishedVisible = nextVisible;
    section.draftContent = null;
    section.displayOrder = Math.max(0, section.draftDisplayOrder);
    section.updatedBy = adminId;
    const published = await homepageSectionRepository.save(section);
    const revision = contentRevisionRepository.create({ recordType: "homepage_section", recordKey: key, action: "published", previousContent: previous, newContent: { content: published.publishedContent, visible: published.publishedVisible, displayOrder: published.displayOrder }, adminUserId: adminId });
    await contentRevisionRepository.save(revision);
    return published;
  }
}

export default new HomepageCmsService();
