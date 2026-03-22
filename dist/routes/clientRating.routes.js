"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chefOrAdmin_middleware_1 = require("../middleware/chefOrAdmin.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const clientRating_controller_1 = require("../controllers/clientRating.controller");
const router = express_1.default.Router();
// Chefs (or admin) rate clients for a booking
router.post('/booking/:bookingId/client/rating', chefOrAdmin_middleware_1.chefOrAdmin, clientRating_controller_1.addOrUpdateClientRating);
// Get ratings for a client
router.get('/client/:clientId/ratings', auth_middleware_1.verifyToken, clientRating_controller_1.getClientRatings);
exports.default = router;
