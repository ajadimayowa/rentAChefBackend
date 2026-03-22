"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const chefRating_controller_1 = require("../controllers/chefRating.controller");
const router = express_1.default.Router();
router.post('/chef/:chefId/rating', auth_middleware_1.verifyUserToken, chefRating_controller_1.addOrUpdateChefRating);
router.get('/chef/:chefId/ratings', auth_middleware_1.verifyUserToken, chefRating_controller_1.getChefRatings);
exports.default = router;
