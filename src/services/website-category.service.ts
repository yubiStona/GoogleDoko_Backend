import { contentRevisionRepository, productRepository, websiteCategoryRepository } from "../repository";
import { appDataSource } from "../config/database";
import { Product } from "../entities/product.entity";
import { WebsiteCategory } from "../entities/website-category.entity";

const groups = new Set(["product", "place", "lifestyle"]);
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const contentObject = (value: unknown): Record<string, any> | null => {
  if (typeof value === "string") { try { return JSON.parse(value); } catch { return null; } }
  return value && typeof value === "object" ? value as Record<string, any> : null;
};
function validate(group: string, content: Record<string, any>) {
  if (!groups.has(group)) throw new Error("INVALID_GROUP");
  if (typeof content.name !== "string" || !content.name.trim() || content.name.length > 160) throw new Error("INVALID_NAME");
  for (const key of ["description", "image", "seoTitle", "metaDescription", "unit"]) if (typeof content[key] !== "string" || content[key].length > 3000) throw new Error(`INVALID_${key.toUpperCase()}`);
  if (content.image && !(content.image.startsWith("/") && !content.image.startsWith("//")) && !/^https:\/\//i.test(content.image)) throw new Error("INVALID_IMAGE_URL");
}

export class WebsiteCategoryService {
  async listAdmin() {
    const rows = await websiteCategoryRepository.find({ order: { group: "ASC", displayOrder: "ASC", updatedAt: "DESC" } });
    const result = [];
    for (const row of rows) {
      const content = contentObject(row.draftContent) || contentObject(row.publishedContent) || {};
      const productCount = row.group === "place"
        ? await productRepository.createQueryBuilder("product").where("product.origin LIKE :origin", { origin: `%${content.name}%` }).getCount()
        : await productRepository.count({ where: { category: content.name } });
      const childCount = await websiteCategoryRepository.count({ where: { parentId: row.id } });
      result.push({ ...row, content, productCount, childCount });
    }
    return result;
  }

  async listPublic(group: string) {
    if (!groups.has(group)) throw new Error("INVALID_GROUP");
    const categoryGroup = group as WebsiteCategory["group"];
    const rows = await websiteCategoryRepository.find({ where: { group: categoryGroup, status: "published" }, order: { displayOrder: "ASC" } });
    return rows.map((row) => ({ id: row.id, slug: row.slug, group: row.group, parentId: row.parentId, ...contentObject(row.publishedContent), displayOrder: row.displayOrder }));
  }

  async saveDraft(id: number | null, input: { group: string; content: Record<string, any>; parentId: number | null; displayOrder: number }, adminId: number) {
    validate(input.group, input.content);
    const categoryGroup = input.group as WebsiteCategory["group"];
    const slug = slugify(input.content.name);
    if (!slug) throw new Error("INVALID_NAME");
    let row = id ? await websiteCategoryRepository.findOne({ where: { id } }) : null;
    if (id && !row) throw new Error("CATEGORY_NOT_FOUND");
    const collision = await websiteCategoryRepository.findOne({ where: { group: categoryGroup, slug } });
    if (collision && collision.id !== id) throw new Error("SLUG_ALREADY_EXISTS");
    if (input.parentId) {
      const parent = await websiteCategoryRepository.findOne({ where: { id: input.parentId } });
      if (!parent || parent.group !== categoryGroup || parent.id === id) throw new Error("INVALID_PARENT");
    }
    row ||= websiteCategoryRepository.create({ group: categoryGroup, slug, parentId: null, draftContent: null, publishedContent: null, status: "draft", displayOrder: 0, createdBy: adminId, updatedBy: adminId });
    const previous = contentObject(row.draftContent);
    row.group = categoryGroup; row.slug = slug; row.parentId = input.parentId;
    row.draftContent = input.content; row.displayOrder = Math.max(0, Math.floor(input.displayOrder)); row.updatedBy = adminId;
    const saved = await websiteCategoryRepository.save(row);
    await contentRevisionRepository.save(contentRevisionRepository.create({ recordType: "website_category", recordKey: String(saved.id), action: "draft_saved", previousContent: previous, newContent: { group: saved.group, content: input.content, parentId: saved.parentId, displayOrder: saved.displayOrder }, adminUserId: adminId }));
    return saved;
  }

  async publish(id: number, adminId: number) {
    const row = await websiteCategoryRepository.findOne({ where: { id } });
    if (!row) throw new Error("CATEGORY_NOT_FOUND");
    const content = contentObject(row.draftContent);
    if (!content) throw new Error("NO_DRAFT");
    validate(row.group, content);
    const previous = { status: row.status, content: contentObject(row.publishedContent) };
    row.publishedContent = content; row.draftContent = null; row.status = "published"; row.updatedBy = adminId;
    const saved = await websiteCategoryRepository.save(row);
    await contentRevisionRepository.save(contentRevisionRepository.create({ recordType: "website_category", recordKey: String(id), action: "published", previousContent: previous, newContent: { group: row.group, content, parentId: row.parentId, displayOrder: row.displayOrder }, adminUserId: adminId }));
    return saved;
  }

  async archive(id: number, adminId: number) {
    const row = await websiteCategoryRepository.findOne({ where: { id } });
    if (!row) throw new Error("CATEGORY_NOT_FOUND");
    row.status = "archived"; row.updatedBy = adminId;
    const saved = await websiteCategoryRepository.save(row);
    await contentRevisionRepository.save(contentRevisionRepository.create({ recordType: "website_category", recordKey: String(id), action: "archived", previousContent: contentObject(row.publishedContent), newContent: null, adminUserId: adminId }));
    return saved;
  }

  async delete(id: number, reassignToId?: number) {
    await appDataSource.transaction(async (manager) => {
      const categoryRepo = manager.getRepository(WebsiteCategory);
      const productRepo = manager.getRepository(Product);
      const row = await categoryRepo.findOne({ where: { id } });
      if (!row) throw new Error("CATEGORY_NOT_FOUND");
      const content = contentObject(row.publishedContent) || contentObject(row.draftContent) || {};
      const productCount = row.group === "place"
        ? await productRepo.createQueryBuilder("product").where("product.origin LIKE :origin", { origin: `%${content.name}%` }).getCount()
        : await productRepo.count({ where: { category: content.name } });
      const childCount = await categoryRepo.count({ where: { parentId: id } });
      let target: any = null;
      if (reassignToId) {
        target = await categoryRepo.findOne({ where: { id: reassignToId } });
        if (!target || target.group !== row.group || target.id === id || target.status !== "published") throw new Error("INVALID_REASSIGNMENT");
      }
      if ((productCount || childCount) && !target) throw new Error(`CATEGORY_IN_USE:${productCount}:${childCount}`);
      if (target) {
        const targetContent = contentObject(target.publishedContent) || {};
        if (row.group === "place") {
          await productRepo.createQueryBuilder().update().set({ origin: () => "REPLACE(origin, :oldName, :newName)" }).where("origin LIKE :origin").setParameters({ oldName: String(content.name), newName: String(targetContent.name), origin: `%${content.name}%` }).execute();
        } else {
          await productRepo.update({ category: content.name }, { category: targetContent.name });
        }
        await categoryRepo.update({ parentId: id }, { parentId: target.id });
      }
      await categoryRepo.delete(id);
    });
  }
}

export default new WebsiteCategoryService();
