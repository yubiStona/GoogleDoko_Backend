import { Request, Response } from "express";
import { settingRepository } from "../repository";
import { sendError, sendSuccess } from "../helpers/response.helper";
import { messages } from "../helpers/message.helper";
import homepageCmsService from "../services/homepage-cms.service";

const defaultContent = {
  eyebrow: "Good food. Better choices. Local love.",
  title: "Welcome to GoogleDoko",
  description: "Discover local food and lifestyle products, all in one place.",
  backgroundImage: "/landing-assets/landing-background.jpg",
  food: {
    eyebrow: "Fresh from Nepal",
    title: "Food with a place of origin.",
    description:
      "Shop farm fresh produce and traditional favourites from local growers.",
    button: "Explore food",
    image: "/landing-assets/food-card-scene.jpg",
    imageAlt: "Traditional Nepali food with a Himalayan hillside and temple",
    href: "/food",
  },
  lifestyle: {
    eyebrow: "Made to be lived with",
    title: "Bring local craft into your home.",
    description:
      "Find thoughtful home, fashion, and handmade goods from Nepalese makers.",
    button: "Explore lifestyle",
    image: "/landing-assets/lifestyle-card-scene.jpg",
    imageAlt: "Nepali handcrafted bag and home goods beside a mountain view",
    href: "/lifestyle-coming-soon",
  },
};

function mediaUrl(value: string | undefined, fallback: string, origin: string) {
  const candidate = value?.trim() || fallback;
  if (/^https?:\/\//i.test(candidate)) return candidate;
  return `${origin}${candidate.startsWith("/") ? candidate : `/${candidate}`}`;
}

export class LandingController {
  async getContent(req: Request, res: Response): Promise<void> {
    try {
      const rows = await settingRepository.find();
      const settings = Object.fromEntries(rows.map(({ key, value }) => [key, value]));
      const cms = await homepageCmsService.getPublishedHomepage();
      const protocol = req.get("x-forwarded-proto")?.split(",")[0]?.trim() || req.protocol;
      const origin = `${protocol}://${req.get("host")}`;
      const foodContent = cms?.food as Record<string, string> | undefined;
      const lifestyleContent = cms?.lifestyle as Record<string, string> | undefined;
      const homepageSections = Object.fromEntries(Object.entries((cms?.sections || {}) as Record<string, Record<string, unknown>>).map(([key, value]) => {
        const content = { ...value };
        for (const imageField of ["image", "backgroundImage"]) {
          if (typeof content[imageField] === "string") content[imageField] = mediaUrl(content[imageField] as string, "", origin);
        }
        return [key, content];
      }));
      const content = {
        eyebrow: (cms?.eyebrow as string) || settings.landing_eyebrow || defaultContent.eyebrow,
        title: (cms?.title as string) || settings.landing_title || defaultContent.title,
        description: (cms?.description as string) || settings.landing_description || defaultContent.description,
        backgroundImage: mediaUrl(
          (cms?.backgroundImage as string) || settings.landing_background_image,
          defaultContent.backgroundImage,
          origin
        ),
        food: {
          ...defaultContent.food,
          eyebrow: foodContent?.eyebrow || settings.landing_food_eyebrow || defaultContent.food.eyebrow,
          title: foodContent?.title || settings.landing_food_title || defaultContent.food.title,
          description:
            foodContent?.description || settings.landing_food_description || defaultContent.food.description,
          button: foodContent?.button || settings.landing_food_button || defaultContent.food.button,
          image: mediaUrl(
            foodContent?.image || (settings.landing_food_image === "/landing-assets/food.png" || settings.landing_food_image === "/landing-assets/food-photo.jpg" ? undefined : settings.landing_food_image),
            defaultContent.food.image,
            origin
          ),
          imageAlt: foodContent?.imageAlt || defaultContent.food.imageAlt,
          href: foodContent?.href || defaultContent.food.href,
        },
        lifestyle: {
          ...defaultContent.lifestyle,
          eyebrow: lifestyleContent?.eyebrow ||
            settings.landing_lifestyle_eyebrow || defaultContent.lifestyle.eyebrow,
          title: lifestyleContent?.title || settings.landing_lifestyle_title || defaultContent.lifestyle.title,
          description:
            lifestyleContent?.description || settings.landing_lifestyle_description ||
            defaultContent.lifestyle.description,
          button:
            lifestyleContent?.button || settings.landing_lifestyle_button || defaultContent.lifestyle.button,
          image: mediaUrl(
            lifestyleContent?.image || (settings.landing_lifestyle_image === "/landing-assets/lifestyle.jpg" || settings.landing_lifestyle_image === "/landing-assets/lifestyle-photo.jpg" ? undefined : settings.landing_lifestyle_image),
            defaultContent.lifestyle.image,
            origin
          ),
          imageAlt: lifestyleContent?.imageAlt || defaultContent.lifestyle.imageAlt,
          href: lifestyleContent?.href || defaultContent.lifestyle.href,
        },
        visibility: {
          hero: cms?.heroVisible ?? 1,
          food: cms?.foodVisible ?? 1,
          lifestyle: cms?.lifestyleVisible ?? 1,
        },
        sections: homepageSections,
        displayOrder: cms?.displayOrder || {},
      };
      sendSuccess(res, 200, "Landing page content retrieved successfully.", content);
    } catch (error) {
      console.error("Get landing content error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }
}

export default new LandingController();
