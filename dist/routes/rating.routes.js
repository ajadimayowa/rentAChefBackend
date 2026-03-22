"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const rating_controller_1 = require("../controllers/rating.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const adminAuth_1 = require("../middleware/adminAuth");
const router = express_1.default.Router();
router.post('/specialmenu/:menuId/rating', auth_middleware_1.verifyUserToken, rating_controller_1.addOrUpdateRating);
router.get('/specialmenu/:menuId/ratings', adminAuth_1.adminAuth, rating_controller_1.getMenuRatings);
exports.default = router;
