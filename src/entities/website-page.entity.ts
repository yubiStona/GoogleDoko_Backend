import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("website_pages")
export class WebsitePage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 160, unique: true })
  slug!: string;

  @Column({ type: "varchar", length: 160, nullable: true, name: "draft_slug" })
  draftSlug!: string | null;

  @Column({ type: "json", nullable: true, name: "draft_content" })
  draftContent!: Record<string, unknown> | null;

  @Column({ type: "json", nullable: true, name: "published_content" })
  publishedContent!: Record<string, unknown> | null;

  @Column({ type: "json", nullable: true, name: "old_slugs" })
  oldSlugs!: string[] | null;

  @Column({ type: "varchar", length: 20, default: "draft" })
  status!: "draft" | "published" | "archived";

  @Column({ type: "tinyint", default: 0, name: "navigation_visible" })
  navigationVisible!: number;

  @Column({ type: "int", default: 0, name: "display_order" })
  displayOrder!: number;

  @Column({ type: "int", nullable: true, name: "created_by" })
  createdBy!: number | null;

  @Column({ type: "int", nullable: true, name: "updated_by" })
  updatedBy!: number | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
