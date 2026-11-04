import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Index,
} from "typeorm";

@Entity("coupons")
export class Coupon {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: "varchar",
    length: 50,
    unique: true,
  })
  code!: string;

  @Column({
    name: "discount_type",
    type: "varchar",
    length: 20,
    default: "percentage",
  })
  discountType!: "percentage" | "fixed";

  @Column({
    name: "discount_value",
    type: "double",
  })
  discountValue!: number;

  @Column({
    name: "min_order",
    type: "double",
    default: 0,
  })
  minOrder!: number;

  @Column({
    name: "max_discount",
    type: "double",
    nullable: true,
  })
  maxDiscount!: number | null;

  @Column({
    name: "max_uses",
    type: "int",
    default: 100,
  })
  maxUses!: number;

  @Column({
    name: "per_customer_limit",
    type: "int",
    default: 1,
  })
  perCustomerLimit!: number;

  @Column({
    name: "first_order_only",
    type: "int",
    default: 0,
  })
  firstOrderOnly!: number;

  @Column({
    name: "times_used",
    type: "int",
    default: 0,
  })
  timesUsed!: number;

  @Column({
    name: "start_date",
    type: "varchar",
    length: 50,
    nullable: true,
  })
  startDate!: string | null;

  @Column({
    name: "expiry_date",
    type: "varchar",
    length: 50,
    nullable: true,
  })
  expiryDate!: string | null;

  @Column({
    type: "int",
    default: 1,
  })
  active!: number;

  @CreateDateColumn({
    name: "created_at",
  })
  createdAt!: Date;
}

@Entity("coupon_redemptions")
@Index("idx_coupon_user", ["couponCode", "userId"])
export class CouponRedemption {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    name: "coupon_code",
    type: "varchar",
    length: 50,
  })
  couponCode!: string;

  @Column({
    name: "user_id",
    type: "int",
  })
  userId!: number;

  @Column({
    name: "order_id",
    type: "varchar",
    length: 100,
  })
  orderId!: string;

  @Column({
    name: "discount_amount",
    type: "double",
  })
  discountAmount!: number;

  @CreateDateColumn({
    name: "created_at",
  })
  createdAt!: Date;
}
