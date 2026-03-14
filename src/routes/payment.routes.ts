import { Router } from "express";
import { verifyUserToken } from "../middleware/auth.middleware";
import { initializePayment, verifyPayment } from "../controllers/payment.controller";

const router = Router();

router.post("/payment/initialize-payment",verifyUserToken, initializePayment);   
router.post("/payment/verify/:reference",verifyUserToken, verifyPayment);  

export default router;
