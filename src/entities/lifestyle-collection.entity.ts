import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("lifestyle_collections")
export class LifestyleCollection {
  @PrimaryColumn({
    type: "varchar",
    length: 100,
  })
  id!: string;

  @Column({
    type: "varchar",
    length: 255,
  })
  name!: string;

  @Column({
    type: "varchar",
    length: 255,
    unique: true,
  })
  slug!: string;

  @Column({
    type: "text",
    nullable: true,
  })
  description!: string;

  @Column({
    type: "varchar",
    length: 500,
    default: "",
  })
  image!: string;

  @Column({
    type: "varchar",
    length: 100,
    default: "",
  })
  icon!: string;

  @Column({
    name: "subcategories_json",
    type: "text",
    nullable: true,
  })
  subcategoriesJson!: string;

  @Column({
    name: "display_order",
    type: "int",
    default: 0,
  })
  displayOrder!: number;

  @Column({
    name: "is_active",
    type: "int",
    default: 1,
  })
  isActive!: number;

  @CreateDateColumn({
    name: "created_at",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
  })
  updatedAt!: Date;
}
