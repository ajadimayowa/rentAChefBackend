"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// routes/stateRoutes.ts
const express_1 = require("express");
const stateController_1 = require("../controllers/stateController");
const router = (0, express_1.Router)();
// Route to get all states
router.get('/states/get-states', stateController_1.getStates);
// Route to get local governments by state ID
router.get('/states/lga/:stateId', stateController_1.getLocalGovernments);
exports.default = router;
