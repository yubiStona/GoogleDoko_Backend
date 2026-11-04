import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity("reviews")
@Index("idx_product_status", ["productId", "status"])
@Index("idx_user", ["userId"])
export class Review {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    name: "product_id",
    type: "varchar",
    length: 100,
  })
  productId!: string;

  @Column({
    name: "user_id",
    type: "int",
  })
  userId!: number;

  @Column({
    name: "order_id",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  orderId!: string | null;

  @Column({
    name: "order_item_id",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  orderItemId!: string | null;

  @Column({
    name: "verified_purchase",
    type: "tinyint",
    default: 1,
  })
  verifiedPurchase!: number;

  @Column({
    type: "int",
  })
  rating!: number;

  @Column({
    type: "varchar",
    length: 255,
    default: "",
  })
  title!: string;

  @Column({
    type: "text",
  })
  body!: string;

  @Column({
    name: "images_json",
    type: "text",
    nullable: true,
  })
  imagesJson!: string | null;

  @Column({
    type: "varchar",
    length: 50,
    default: "approved",
  })
  status!: string; // "approved" | "pending" | "rejected" | "hidden"

  @Column({
    name: "helpful_count",
    type: "int",
    default: 0,
  })
  helpfulCount!: number;

  @Column({
    type: "text",
    nullable: true,
  })
  reply!: string | null;

  @Column({
    name: "reply_at",
    type: "datetime",
    nullable: true,
  })
  replyAt!: Date | null;

  @CreateDateColumn({
    name: "created_at",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
    nullable: true,
  })
  updatedAt!: Date;
}

@Entity("review_helpful_votes")
@Index("idx_review_user", ["reviewId", "userId"], { unique: true })
export class ReviewHelpfulVote {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    name: "review_id",
    type: "int",
  })
  reviewId!: number;

  @Column({
    name: "user_id",
    type: "int",
  })
  userId!: number;

  @CreateDateColumn({
    name: "created_at",
  })
  createdAt!: Date;
}
