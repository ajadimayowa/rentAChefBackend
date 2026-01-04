import { Router } from "express";
import {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category/category.controller";
import { addServiceToCategory } from "../controllers/category/category.service.controller";
import uploadAdImages from "../middleware/upload";
import { adminAuth } from "../middleware/adminAuth";

const router = Router();

// Category CRUD
router.post("/category/create",adminAuth,uploadAdImages.single("catPic"), createCategory);
// router.post("/chef/register",adminAuth, createChef);
router.get("/category/categories", getAllCategories);
router.get("/category/:id", getSingleCategory);
router.put("/category/:id", updateCategory);
router.delete("/category/:id", deleteCategory);

// Services
router.post("/:categoryId/services", addServiceToCategory);

export default router;