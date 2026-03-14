"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const payment_controller_1 = require("../controllers/payment.controller");
const router = (0, express_1.Router)();
router.post("/payment/initialize-payment", auth_middleware_1.verifyUserToken, payment_controller_1.initializePayment);
router.post("/payment/verify/:reference", auth_middleware_1.verifyUserToken, payment_controller_1.verifyPayment);
exports.default = router;
