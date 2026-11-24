import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ sections: [] as any[], pages: [] as any[], revisions: [] as any[] }));

vi.mock("../repository", () => ({
  settingRepository: { find: vi.fn(async () => []) },
  homepageSectionRepository: {
    find: vi.fn(async () => state.sections),
    findOne: vi.fn(async ({ where }: any) => state.sections.find((section) => section.key === where.key) || null),
    create: vi.fn((value: any) => ({ publishedVisible: 1, draftVisible: 1, displayOrder: 0, ...value })),
    save: vi.fn(async (section: any) => {
      const index = state.sections.findIndex((item) => item.key === section.key);
      if (index < 0) state.sections.push(section); else state.sections[index] = section;
      return section;
    }),
  },
  contentRevisionRepository: {
    create: vi.fn((value: any) => value),
    save: vi.fn(async (revision: any) => { state.revisions.push(revision); return revision; }),
  },
  websitePageRepository: {
    find: vi.fn(async (options: any = {}) => options.where?.status ? state.pages.filter((page) => page.status === options.where.status) : state.pages),
    findOne: vi.fn(async ({ where }: any) => state.pages.find((page) => Object.entries(where).every(([key, value]) => page[key] === value)) || null),
    create: vi.fn((value: any) => ({ id: 1, oldSlugs: [], status: "draft", ...value })),
    save: vi.fn(async (page: any) => { const index = state.pages.findIndex((item) => item.id === page.id); if (index < 0) state.pages.push(page); else state.pages[index] = page; return page; }),
  },
}));

import homepageCmsService from "../services/homepage-cms.service";

describe("homepage CMS publishing", () => {
  beforeEach(() => { state.sections = []; state.pages = []; state.revisions = []; });

  it("keeps saved drafts out of the public homepage until publish", async () => {
    const [hero] = await homepageCmsService.getAdminHomepage();
    const draft = { ...hero.draftContent, title: "A draft headline" };
    await homepageCmsService.saveDraft("hero", draft, true, 0, 8);

    expect(await homepageCmsService.getPublishedHomepage()).toBeNull();
    expect((await homepageCmsService.getAdminHomepage())[0].draftContent.title).toBe("A draft headline");
  });

  it("publishes the saved version and records an audit revision", async () => {
    const [hero] = await homepageCmsService.getAdminHomepage();
    const draft = { ...hero.draftContent, title: "Published headline" };
    await homepageCmsService.saveDraft("hero", draft, false, 0, 8);
    await homepageCmsService.publish("hero", 8);

    const published = await homepageCmsService.getPublishedHomepage();
    expect(published?.title).toBe("Published headline");
    expect(published?.heroVisible).toBe(0);
    expect(state.revisions).toHaveLength(2);
    expect(state.revisions[1].adminUserId).toBe(8);
  });

  it("rejects unsafe external destinations", async () => {
    const [food] = (await homepageCmsService.getAdminHomepage()).filter((section) => section.key === "food");
    await expect(homepageCmsService.saveDraft("food", { ...food.draftContent, href: "javascript:alert(1)" }, true, 1, 8)).rejects.toThrow("INVALID_DESTINATION");
  });
});

import websitePageService from "../services/website-page.service";

describe("website page publishing", () => {
  beforeEach(() => { state.pages = []; state.revisions = []; });
  const pageContent = { title: "About GoogleDoko", description: "Local marketplace", body: "First paragraph\n\nSecond paragraph", heroImage: "", imageAlt: "", seoTitle: "About", metaDescription: "About us", socialTitle: "Our story", socialDescription: "Support local", ogImage: "" };

  it("keeps page drafts private and returns only published pages", async () => {
    const saved = await websitePageService.saveDraft(null, { slug: "about", content: pageContent, navigationVisible: true, displayOrder: 0 }, 5);
    expect(await websitePageService.getPublic("about")).toBeNull();
    await websitePageService.publish(saved.id, 5);
    expect((await websitePageService.getPublic("about"))?.title).toBe("About GoogleDoko");
  });

  it("redirects the old URL after a published slug change", async () => {
    const saved = await websitePageService.saveDraft(null, { slug: "about", content: pageContent, navigationVisible: true, displayOrder: 0 }, 5);
    await websitePageService.publish(saved.id, 5);
    await websitePageService.saveDraft(saved.id, { slug: "our-story", content: pageContent, navigationVisible: true, displayOrder: 0 }, 5);
    await websitePageService.publish(saved.id, 5);
    expect((await websitePageService.getPublic("about"))?.redirect).toBe(true);
    expect((await websitePageService.getPublic("our-story"))?.redirect).toBe(false);
  });
});
