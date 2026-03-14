import express from "express";
import {
  createQuote,
  getQuotes,
  getQuote,
  updateQuote,
  deleteQuote,
} from "../controllers/quotes/quote.controller";

const router = express.Router();

router.post("/quote/create", createQuote);
router.get("/quotes", getQuotes);
router.get("/quote/:id", getQuote);
router.put("/quote/:id", updateQuote);
router.delete("/quote/:id", deleteQuote);

export default router;