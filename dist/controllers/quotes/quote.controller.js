"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.replyToQuote = exports.deleteQuote = exports.updateQuote = exports.getQuote = exports.getQuotes = exports.createQuote = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Quote_1 = require("../../models/Quote");
const getRequestUser = (req) => req.user;
const isAdminUser = (user) => {
    if (!user)
        return false;
    return user.userType === "Admin";
};
// CREATE QUOTE
const createQuote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = getRequestUser(req);
        const { title, description } = req.body;
        if (!(user === null || user === void 0 ? void 0 : user._id)) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: "title and description are required",
            });
        }
        const quote = yield Quote_1.QuoteModel.create({
            title: String(title).trim(),
            description: String(description).trim(),
            customerId: user._id,
        });
        return res.status(201).json({
            success: true,
            payload: quote,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error creating quote",
            error,
        });
    }
});
exports.createQuote = createQuote;
// GET ALL QUOTES
const getQuotes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = getRequestUser(req);
        const admin = isAdminUser(user);
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.max(Number(req.query.limit) || 10, 1);
        const skip = (page - 1) * limit;
        const customerIdQuery = typeof req.query.customerId === "string" ? req.query.customerId.trim() : "";
        const statusQuery = typeof req.query.status === "string" ? req.query.status.trim().toUpperCase() : "";
        const query = {};
        if (statusQuery) {
            query.status = statusQuery;
        }
        if (admin) {
            if (customerIdQuery) {
                if (!mongoose_1.default.Types.ObjectId.isValid(customerIdQuery)) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid customerId",
                    });
                }
                query.customerId = customerIdQuery;
            }
        }
        else {
            if (!(user === null || user === void 0 ? void 0 : user._id)) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            query.customerId = user._id;
        }
        const [quotes, total] = yield Promise.all([
            Quote_1.QuoteModel.find(query)
                .populate("customerId", "fullName firstName email phone")
                .populate("adminResponse.respondedBy", "fullName firstName email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Quote_1.QuoteModel.countDocuments(query),
        ]);
        return res.json({
            success: true,
            payload: quotes,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching quotes",
        });
    }
});
exports.getQuotes = getQuotes;
// GET SINGLE QUOTE
const getQuote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = getRequestUser(req);
        const admin = isAdminUser(user);
        if (!mongoose_1.default.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid quote id",
            });
        }
        const quote = yield Quote_1.QuoteModel.findById(req.params.id)
            .populate("customerId", "fullName firstName email phone")
            .populate("adminResponse.respondedBy", "fullName firstName email");
        if (!quote) {
            return res.status(404).json({
                success: false,
                message: "Quote not found",
            });
        }
        if (!admin && String(quote.customerId) !== String(user === null || user === void 0 ? void 0 : user._id)) {
            return res.status(403).json({
                success: false,
                message: "Forbidden",
            });
        }
        return res.json({
            success: true,
            payload: quote,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching quote",
        });
    }
});
exports.getQuote = getQuote;
// UPDATE QUOTE
const updateQuote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    try {
        const user = getRequestUser(req);
        const admin = isAdminUser(user);
        if (!mongoose_1.default.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid quote id",
            });
        }
        const quote = yield Quote_1.QuoteModel.findById(req.params.id);
        if (!quote) {
            return res.status(404).json({
                success: false,
                message: "Quote not found",
            });
        }
        if (!admin && String(quote.customerId) !== String(user === null || user === void 0 ? void 0 : user._id)) {
            return res.status(403).json({
                success: false,
                message: "Forbidden",
            });
        }
        if (admin) {
            const responseMessage = typeof ((_b = (_a = req.body) === null || _a === void 0 ? void 0 : _a.adminResponse) === null || _b === void 0 ? void 0 : _b.message) === "string"
                ? req.body.adminResponse.message.trim()
                : typeof ((_c = req.body) === null || _c === void 0 ? void 0 : _c.responseMessage) === "string"
                    ? req.body.responseMessage.trim()
                    : "";
            if (responseMessage) {
                quote.adminResponse = {
                    message: responseMessage,
                    respondedBy: user._id,
                    respondedAt: new Date(),
                };
                quote.status = "RESPONDED";
            }
            if (typeof ((_d = req.body) === null || _d === void 0 ? void 0 : _d.status) === "string") {
                const status = req.body.status.toUpperCase();
                if (["PENDING", "RESPONDED", "CLOSED"].includes(status)) {
                    quote.status = status;
                }
            }
        }
        else {
            if (typeof ((_e = req.body) === null || _e === void 0 ? void 0 : _e.title) === "string" && req.body.title.trim()) {
                quote.title = req.body.title.trim();
            }
            if (typeof ((_f = req.body) === null || _f === void 0 ? void 0 : _f.description) === "string" && req.body.description.trim()) {
                quote.description = req.body.description.trim();
            }
            quote.status = "PENDING";
        }
        yield quote.save();
        const updatedQuote = yield Quote_1.QuoteModel.findById(quote._id)
            .populate("customerId", "fullName firstName email phone")
            .populate("adminResponse.respondedBy", "fullName firstName email");
        return res.json({
            success: true,
            payload: updatedQuote,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error updating quote",
        });
    }
});
exports.updateQuote = updateQuote;
// DELETE QUOTE
const deleteQuote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = getRequestUser(req);
        const admin = isAdminUser(user);
        if (!mongoose_1.default.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid quote id",
            });
        }
        const quote = yield Quote_1.QuoteModel.findById(req.params.id);
        if (!quote) {
            return res.status(404).json({
                success: false,
                message: "Quote not found",
            });
        }
        if (!admin && String(quote.customerId) !== String(user === null || user === void 0 ? void 0 : user._id)) {
            return res.status(403).json({
                success: false,
                message: "Forbidden",
            });
        }
        yield quote.deleteOne();
        return res.json({
            success: true,
            message: "Quote deleted successfully",
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error deleting quote",
        });
    }
});
exports.deleteQuote = deleteQuote;
// ADMIN REPLY TO QUOTE
const replyToQuote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = getRequestUser(req);
        if (!isAdminUser(user)) {
            return res.status(403).json({
                success: false,
                message: "Admin only",
            });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid quote id",
            });
        }
        const message = typeof ((_a = req.body) === null || _a === void 0 ? void 0 : _a.message) === "string" ? req.body.message.trim() : "";
        if (!message) {
            return res.status(400).json({
                success: false,
                message: "message is required",
            });
        }
        const quote = yield Quote_1.QuoteModel.findById(req.params.id);
        if (!quote) {
            return res.status(404).json({
                success: false,
                message: "Quote not found",
            });
        }
        quote.adminResponse = {
            message,
            respondedBy: user._id,
            respondedAt: new Date(),
        };
        quote.status = "RESPONDED";
        yield quote.save();
        const updatedQuote = yield Quote_1.QuoteModel.findById(quote._id)
            .populate("customerId", "fullName firstName email phone")
            .populate("adminResponse.respondedBy", "fullName firstName email");
        return res.json({
            success: true,
            payload: updatedQuote,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error replying to quote",
        });
    }
});
exports.replyToQuote = replyToQuote;
