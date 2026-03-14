"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const quote_controller_1 = require("../controllers/quotes/quote.controller");
const router = express_1.default.Router();
router.post("/quote/create", quote_controller_1.createQuote);
router.get("/quotes", quote_controller_1.getQuotes);
router.get("/quote/:id", quote_controller_1.getQuote);
router.put("/quote/:id", quote_controller_1.updateQuote);
router.delete("/quote/:id", quote_controller_1.deleteQuote);
exports.default = router;
