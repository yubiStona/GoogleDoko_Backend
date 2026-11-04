import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
} from "typeorm";

@Entity("product_lifestyles")
export class ProductLifestyle {
  @PrimaryColumn({
    name: "product_id",
    type: "varchar",
    length: 100,
  })
  productId!: string;

  @PrimaryColumn({
    name: "lifestyle_id",
    type: "varchar",
    length: 100,
  })
  lifestyleId!: string;

  @Column({
    type: "varchar",
    length: 100,
    nullable: true,
  })
  subcategory!: string | null;

  @CreateDateColumn({
    name: "created_at",
  })
  createdAt!: Date;
}
