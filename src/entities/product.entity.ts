import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("products")
export class Product {
  @PrimaryColumn({
    type: "varchar",
    length: 100,
  })
  id!: string;

  @Column({
    name: "vendor_user_id",
    type: "int",
    nullable: true,
  })
  vendorUserId!: number | null;

  @Column({
    type: "varchar",
    length: 255,
  })
  name!: string;

  @Column({
    type: "varchar",
    length: 100,
  })
  category!: string;

  @Column({
    type: "varchar",
    length: 50,
  })
  weight!: string;

  @Column({
    name: "selling_unit",
    type: "varchar",
    length: 50,
    default: "piece",
  })
  sellingUnit!: string;

  @Column({
    name: "allow_decimals",
    type: "int",
    default: 0,
  })
  allowDecimals!: number;

  @Column({
    name: "variants_json",
    type: "text",
    nullable: true,
  })
  variantsJson!: string | null;

  @Column({
    type: "double",
  })
  price!: number;

  @Column({
    type: "double",
    default: 4.8,
  })
  rating!: number;

  @Column({
    type: "varchar",
    length: 50,
    default: "0",
  })
  sold!: string;

  @Column({
    type: "varchar",
    length: 255,
    default: "Nepal",
  })
  origin!: string;

  @Column({
    type: "varchar",
    length: 255,
    default: "GoogleDoko Store",
  })
  seller!: string;

  @Column({
    type: "varchar",
    length: 500,
    default: "",
  })
  image!: string;

  @Column({
    type: "int",
    default: 100,
  })
  stock!: number;

  @Column({
    type: "int",
    default: 1,
  })
  active!: number;

  @Column({
    type: "text",
    nullable: true,
  })
  description!: string | null;

  @CreateDateColumn({
    name: "created_at",
  })
  createdAt!: Date;
}
