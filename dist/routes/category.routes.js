"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_controller_1 = require("../controllers/category/category.controller");
const category_service_controller_1 = require("../controllers/category/category.service.controller");
const upload_1 = __importDefault(require("../middleware/upload"));
const adminAuth_1 = require("../middleware/adminAuth");
const router = (0, express_1.Router)();
// Category CRUD
router.post("/category/create", adminAuth_1.adminAuth, upload_1.default.single("catPic"), category_controller_1.createCategory);
// router.post("/chef/register",adminAuth, createChef);
router.get("/category/categories", category_controller_1.getAllCategories);
router.get("/category/:id", category_controller_1.getSingleCategory);
router.put("/category/:id", category_controller_1.updateCategory);
router.delete("/category/:id", category_controller_1.deleteCategory);
// Services
router.post("/:categoryId/services", category_service_controller_1.addServiceToCategory);
exports.default = router;
