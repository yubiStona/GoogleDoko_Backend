import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("website_categories")
@Index("uq_website_category_group_slug", ["group", "slug"], { unique: true })
export class WebsiteCategory {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column({ type: "varchar", length: 20 })
  group!: "product" | "place" | "lifestyle";
  @Column({ type: "varchar", length: 160 })
  slug!: string;
  @Column({ type: "int", nullable: true, name: "parent_id" })
  parentId!: number | null;
  @Column({ type: "json", nullable: true, name: "draft_content" })
  draftContent!: Record<string, unknown> | null;
  @Column({ type: "json", nullable: true, name: "published_content" })
  publishedContent!: Record<string, unknown> | null;
  @Column({ type: "varchar", length: 20, default: "draft" })
  status!: "draft" | "published" | "archived";
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
