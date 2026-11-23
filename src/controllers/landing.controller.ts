import { Request, Response } from "express";
import { settingRepository } from "../repository";
import { sendError, sendSuccess } from "../helpers/response.helper";
import { messages } from "../helpers/message.helper";

const defaultContent = {
  eyebrow: "Good things, from close to home",
  title: "Welcome to GoogleDoko",
  description: "Discover local food and lifestyle products, all in one place.",
  food: {
    eyebrow: "Fresh from Nepal",
    title: "Food with a place of origin.",
    description:
      "Shop farm fresh produce and traditional favourites from local growers.",
    button: "Explore food",
    image: "/landing-assets/food-photo.jpg",
    imageAlt: "Traditional Nepalese momo served with dipping sauce",
    href: "/food",
  },
  lifestyle: {
    eyebrow: "Made to be lived with",
    title: "Bring local craft into your home.",
    description:
      "Find thoughtful home, fashion, and handmade goods from Nepalese makers.",
    button: "Explore lifestyle",
    image: "/landing-assets/lifestyle-photo.jpg",
    imageAlt: "Colorful locally made bag and home goods",
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
      const protocol = req.get("x-forwarded-proto")?.split(",")[0]?.trim() || req.protocol;
      const origin = `${protocol}://${req.get("host")}`;
      const content = {
        eyebrow: settings.landing_eyebrow || defaultContent.eyebrow,
        title: settings.landing_title || defaultContent.title,
        description: settings.landing_description || defaultContent.description,
        food: {
          ...defaultContent.food,
          eyebrow: settings.landing_food_eyebrow || defaultContent.food.eyebrow,
          title: settings.landing_food_title || defaultContent.food.title,
          description:
            settings.landing_food_description || defaultContent.food.description,
          button: settings.landing_food_button || defaultContent.food.button,
          image: mediaUrl(
            settings.landing_food_image === "/landing-assets/food.png"
              ? undefined
              : settings.landing_food_image,
            defaultContent.food.image,
            origin
          ),
        },
        lifestyle: {
          ...defaultContent.lifestyle,
          eyebrow:
            settings.landing_lifestyle_eyebrow || defaultContent.lifestyle.eyebrow,
          title: settings.landing_lifestyle_title || defaultContent.lifestyle.title,
          description:
            settings.landing_lifestyle_description ||
            defaultContent.lifestyle.description,
          button:
            settings.landing_lifestyle_button || defaultContent.lifestyle.button,
          image: mediaUrl(
            settings.landing_lifestyle_image === "/landing-assets/lifestyle.jpg"
              ? undefined
              : settings.landing_lifestyle_image,
            defaultContent.lifestyle.image,
            origin
          ),
        },
      };
      sendSuccess(res, 200, "Landing page content retrieved successfully.", content);
    } catch (error) {
      console.error("Get landing content error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }
}

export default new LandingController();
