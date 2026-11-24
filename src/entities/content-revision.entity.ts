import { CreateDateColumn, Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity("content_revisions")
@Index("idx_content_revision_record", ["recordType", "recordKey", "createdAt"])
export class ContentRevision {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 60, name: "record_type" })
  recordType!: string;

  @Column({ type: "varchar", length: 120, name: "record_key" })
  recordKey!: string;

  @Column({ type: "varchar", length: 30 })
  action!: string;

  @Column({ type: "json", nullable: true, name: "previous_content" })
  previousContent!: Record<string, unknown> | null;

  @Column({ type: "json", nullable: true, name: "new_content" })
  newContent!: Record<string, unknown> | null;

  @Column({ type: "int", nullable: true, name: "admin_user_id" })
  adminUserId!: number | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
