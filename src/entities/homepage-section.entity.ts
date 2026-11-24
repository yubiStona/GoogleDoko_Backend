import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity("homepage_sections")
export class HomepageSection {
  @PrimaryColumn({ type: "varchar", length: 80, name: "section_key" })
  key!: string;

  @Column({ type: "json", nullable: true, name: "draft_content" })
  draftContent!: Record<string, unknown> | null;

  @Column({ type: "json", nullable: true, name: "published_content" })
  publishedContent!: Record<string, unknown> | null;

  @Column({ type: "tinyint", default: 1, name: "published_visible" })
  publishedVisible!: number;

  @Column({ type: "tinyint", default: 1, name: "draft_visible" })
  draftVisible!: number;

  @Column({ type: "int", default: 0, name: "display_order" })
  displayOrder!: number;

  @Column({ type: "int", default: 0, name: "draft_display_order" })
  draftDisplayOrder!: number;

  @Column({ type: "int", nullable: true, name: "updated_by" })
  updatedBy!: number | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
