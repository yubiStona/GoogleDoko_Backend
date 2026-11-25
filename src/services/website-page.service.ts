import { contentRevisionRepository, websitePageRepository } from "../repository";

const safeSlug = (slug: string) => slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const pageFields = ["title", "description", "body", "heroImage", "imageAlt", "seoTitle", "metaDescription", "socialTitle", "socialDescription", "ogImage", "sectionTitle", "sectionDescription", "promoTitle", "promoDescription", "promoImage", "promoButton", "promoHref"];
const optionalPageFields = new Set(["sectionTitle", "sectionDescription", "promoTitle", "promoDescription", "promoImage", "promoButton", "promoHref"]);
function objectContent(value: unknown) {
  if (typeof value === "string") { try { return JSON.parse(value) as Record<string, unknown>; } catch { return null; } }
  return value && typeof value === "object" ? value as Record<string, unknown> : null;
}
function validate(content: Record<string, unknown>) {
  for (const key of pageFields) {
    const value = content[key];
    if ((value === undefined && optionalPageFields.has(key))) continue;
    if (typeof value !== "string" || value.length > (key === "body" ? 30000 : 3000)) throw new Error(`INVALID_${key.toUpperCase()}`);
  }
  if (!String(content.title).trim() || !String(content.description).trim()) throw new Error("TITLE_AND_DESCRIPTION_REQUIRED");
  for (const key of ["heroImage", "ogImage", "promoImage"]) {
    const url = String(content[key] || "").trim();
    if (url && !(url.startsWith("/") && !url.startsWith("//")) && !/^https:\/\//i.test(url)) throw new Error("INVALID_IMAGE_URL");
  }
  const promoHref = String(content.promoHref || "").trim();
  if (promoHref && !((promoHref.startsWith("/") && !promoHref.startsWith("//")) || /^https:\/\//i.test(promoHref))) throw new Error("INVALID_PROMO_DESTINATION");
}

export class WebsitePageService {
  async listAdmin() {
    const pages = await websitePageRepository.find({ order: { displayOrder: "ASC", updatedAt: "DESC" } });
    return pages.map((page) => ({ ...page, draftContent: objectContent(page.draftContent), publishedContent: objectContent(page.publishedContent) }));
  }

  async saveDraft(id: number | null, body: { slug: string; content: Record<string, unknown>; navigationVisible: boolean; displayOrder: number }, adminId: number) {
    const slug = safeSlug(body.slug);
    if (!slug) throw new Error("INVALID_SLUG");
    validate(body.content);
    const pages = await websitePageRepository.find();
    const existing = id ? pages.find((page) => page.id === id) : undefined;
    if (id && !existing) throw new Error("PAGE_NOT_FOUND");
    if (pages.some((page) => page.id !== id && (page.slug === slug || page.draftSlug === slug))) throw new Error("SLUG_ALREADY_EXISTS");
    const page = existing || websitePageRepository.create({ slug, draftSlug: slug, draftContent: null, publishedContent: null, oldSlugs: [], status: "draft", navigationVisible: 0, displayOrder: 0, createdBy: adminId, updatedBy: adminId });
    const oldDraft = objectContent(page.draftContent);
    const priorDraftSlug = page.draftSlug;
    page.draftSlug = slug;
    page.draftContent = body.content;
    page.navigationVisible = body.navigationVisible ? 1 : 0;
    page.displayOrder = Math.max(0, Math.floor(body.displayOrder));
    page.updatedBy = adminId;
    const saved = await websitePageRepository.save(page);
    await contentRevisionRepository.save(contentRevisionRepository.create({
      recordType: "website_page", recordKey: String(saved.id), action: "draft_saved",
      previousContent: oldDraft ? { slug: priorDraftSlug, ...oldDraft } : null,
      newContent: { slug, content: body.content, navigationVisible: saved.navigationVisible, displayOrder: saved.displayOrder },
      adminUserId: adminId,
    }));
    return saved;
  }

  async publish(id: number, adminId: number) {
    const page = await websitePageRepository.findOne({ where: { id } });
    if (!page) throw new Error("PAGE_NOT_FOUND");
    const content = objectContent(page.draftContent);
    if (!content || !page.draftSlug) throw new Error("NO_DRAFT");
    validate(content);
    const slugInUse = await websitePageRepository.findOne({ where: { slug: page.draftSlug } });
    if (slugInUse && slugInUse.id !== id) throw new Error("SLUG_ALREADY_EXISTS");
    const previous = { slug: page.slug, content: objectContent(page.publishedContent), status: page.status, navigationVisible: page.navigationVisible, displayOrder: page.displayOrder };
    if (page.slug && page.slug !== page.draftSlug) page.oldSlugs = Array.from(new Set([...(page.oldSlugs || []), page.slug]));
    page.slug = page.draftSlug;
    page.publishedContent = content;
    page.draftContent = null;
    page.draftSlug = null;
    page.status = "published";
    page.updatedBy = adminId;
    const saved = await websitePageRepository.save(page);
    await contentRevisionRepository.save(contentRevisionRepository.create({ recordType: "website_page", recordKey: String(id), action: "published", previousContent: previous, newContent: { slug: saved.slug, content, status: saved.status, navigationVisible: saved.navigationVisible, displayOrder: saved.displayOrder }, adminUserId: adminId }));
    return saved;
  }

  async setStatus(id: number, status: "draft" | "archived", adminId: number) {
    const page = await websitePageRepository.findOne({ where: { id } });
    if (!page) throw new Error("PAGE_NOT_FOUND");
    const previous = { slug: page.slug, content: objectContent(page.publishedContent), status: page.status };
    page.status = status;
    page.updatedBy = adminId;
    const saved = await websitePageRepository.save(page);
    await contentRevisionRepository.save(contentRevisionRepository.create({ recordType: "website_page", recordKey: String(id), action: status === "archived" ? "archived" : "unpublished", previousContent: previous, newContent: { slug: page.slug, status }, adminUserId: adminId }));
    return saved;
  }

  async getPublic(slug: string) {
    const key = safeSlug(slug);
    const pages = await websitePageRepository.find({ where: { status: "published" }, order: { displayOrder: "ASC" } });
    const page = pages.find((item) => item.slug === key || (item.oldSlugs || []).includes(key));
    if (!page || !page.publishedContent) return null;
    return { slug: page.slug, redirect: page.slug !== key, navigationVisible: Boolean(page.navigationVisible), displayOrder: page.displayOrder, ...objectContent(page.publishedContent) };
  }

  async getNavigation() {
    const pages = await websitePageRepository.find({ where: { status: "published", navigationVisible: 1 }, order: { displayOrder: "ASC" } });
    return pages.map((page) => {
      const content = objectContent(page.publishedContent) || {};
      return { slug: page.slug, title: String(content.title || page.slug), displayOrder: page.displayOrder };
    });
  }
}

export default new WebsitePageService();
