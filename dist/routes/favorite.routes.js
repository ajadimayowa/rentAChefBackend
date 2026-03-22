"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const favorite_controller_1 = require("../controllers/favorite.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// Toggle favorite for a special menu (add/remove)
router.post('/specialmenu/:menuId/favorite', auth_middleware_1.verifyToken, favorite_controller_1.toggleFavorite);
router.delete('/specialmenu/:menuId/favorite', auth_middleware_1.verifyToken, favorite_controller_1.toggleFavorite);
router.get('/favorites', auth_middleware_1.verifyToken, favorite_controller_1.getUserFavorites);
exports.default = router;
