"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.objectId = exports.timestamps = void 0;
const mongoose_1 = require("mongoose");
exports.timestamps = {
    timestamps: true,
};
exports.objectId = mongoose_1.Schema.Types.ObjectId;
