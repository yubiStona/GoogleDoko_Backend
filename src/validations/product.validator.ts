import { body } from "express-validator";

export const createProductValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required."),

  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required."),

  body("price")
    .isFloat({ gt: 0 })
    .withMessage("Price must be a valid positive number."),

  body("weight")
    .optional()
    .trim(),

  body("sellingUnit")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Selling unit must be a valid unit."),
];

export const updateProductValidator = [
  body("name").optional().trim().notEmpty().withMessage("Product name cannot be empty."),
  body("category").optional().trim().notEmpty().withMessage("Category cannot be empty."),
  body("price").optional().isFloat({ gt: 0 }).withMessage("Price must be a valid positive number."),
  body("weight").optional().trim(),
  body("sellingUnit").optional().trim().notEmpty().withMessage("Selling unit cannot be empty."),
];
