import { Request, Response } from "express";
import mongoose from "mongoose";
import { QuoteModel } from "../../models/Quote";

const getRequestUser = (req: Request): any => (req as any).user;

const isAdminUser = (user: any): boolean => {
    if (!user) return false;
    return user.isAdmin === true || user.role === "ADMIN";
};

// CREATE QUOTE
export const createQuote = async (req: Request, res: Response): Promise<any> => {
    try {
        const user = getRequestUser(req);
        const { title, description } = req.body;

        if (!user?._id) {
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

        const quote = await QuoteModel.create({
            title: String(title).trim(),
            description: String(description).trim(),
            customerId: user._id,
        });

        return res.status(201).json({
            success: true,
            payload: quote,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error creating quote",
            error,
        });
    }
};


// GET ALL QUOTES
export const getQuotes = async (req: Request, res: Response): Promise<any> => {
    try {
        const user = getRequestUser(req);
        const admin = isAdminUser(user);

        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.max(Number(req.query.limit) || 10, 1);
        const skip = (page - 1) * limit;

        const customerIdQuery = typeof req.query.customerId === "string" ? req.query.customerId.trim() : "";
        const statusQuery = typeof req.query.status === "string" ? req.query.status.trim().toUpperCase() : "";

        const query: any = {};

        if (statusQuery) {
            query.status = statusQuery;
        }

        if (admin) {
            if (customerIdQuery) {
                if (!mongoose.Types.ObjectId.isValid(customerIdQuery)) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid customerId",
                    });
                }
                query.customerId = customerIdQuery;
            }
        } else {
            if (!user?._id) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            query.customerId = user._id;
        }

        const [quotes, total] = await Promise.all([
            QuoteModel.find(query)
                .populate("customerId", "fullName firstName email phone")
                .populate("adminResponse.respondedBy", "fullName firstName email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            QuoteModel.countDocuments(query),
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
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching quotes",
        });
    }
};


// GET SINGLE QUOTE
export const getQuote = async (req: Request, res: Response): Promise<any> => {
    try {
        const user = getRequestUser(req);
        const admin = isAdminUser(user);

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid quote id",
            });
        }

        const quote = await QuoteModel.findById(req.params.id)
            .populate("customerId", "fullName firstName email phone")
            .populate("adminResponse.respondedBy", "fullName firstName email");

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: "Quote not found",
            });
        }

        if (!admin && String(quote.customerId) !== String(user?._id)) {
            return res.status(403).json({
                success: false,
                message: "Forbidden",
            });
        }

        return res.json({
            success: true,
            payload: quote,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching quote",
        });
    }
};


// UPDATE QUOTE
export const updateQuote = async (req: Request, res: Response): Promise<any> => {
    try {
        const user = getRequestUser(req);
        const admin = isAdminUser(user);

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid quote id",
            });
        }

        const quote = await QuoteModel.findById(req.params.id);

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: "Quote not found",
            });
        }

        if (!admin && String(quote.customerId) !== String(user?._id)) {
            return res.status(403).json({
                success: false,
                message: "Forbidden",
            });
        }

        if (admin) {
            const responseMessage = typeof req.body?.adminResponse?.message === "string"
                ? req.body.adminResponse.message.trim()
                : typeof req.body?.responseMessage === "string"
                    ? req.body.responseMessage.trim()
                    : "";

            if (responseMessage) {
                quote.adminResponse = {
                    message: responseMessage,
                    respondedBy: user._id,
                    respondedAt: new Date(),
                } as any;
                quote.status = "RESPONDED";
            }

            if (typeof req.body?.status === "string") {
                const status = req.body.status.toUpperCase();
                if (["PENDING", "RESPONDED", "CLOSED"].includes(status)) {
                    quote.status = status as "PENDING" | "RESPONDED" | "CLOSED";
                }
            }
        } else {
            if (typeof req.body?.title === "string" && req.body.title.trim()) {
                quote.title = req.body.title.trim();
            }

            if (typeof req.body?.description === "string" && req.body.description.trim()) {
                quote.description = req.body.description.trim();
            }

            quote.status = "PENDING";
        }

        await quote.save();

        const updatedQuote = await QuoteModel.findById(quote._id)
            .populate("customerId", "fullName firstName email phone")
            .populate("adminResponse.respondedBy", "fullName firstName email");

        return res.json({
            success: true,
            payload: updatedQuote,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error updating quote",
        });
    }
};


// DELETE QUOTE
export const deleteQuote = async (req: Request, res: Response): Promise<any> => {
    try {
        const user = getRequestUser(req);
        const admin = isAdminUser(user);

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid quote id",
            });
        }

        const quote = await QuoteModel.findById(req.params.id);

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: "Quote not found",
            });
        }

        if (!admin && String(quote.customerId) !== String(user?._id)) {
            return res.status(403).json({
                success: false,
                message: "Forbidden",
            });
        }

        await quote.deleteOne();

        return res.json({
            success: true,
            message: "Quote deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error deleting quote",
        });
    }
};


// ADMIN REPLY TO QUOTE
export const replyToQuote = async (req: Request, res: Response): Promise<any> => {
    try {
        const user = getRequestUser(req);

        if (!isAdminUser(user)) {
            return res.status(403).json({
                success: false,
                message: "Admin only",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid quote id",
            });
        }

        const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";

        if (!message) {
            return res.status(400).json({
                success: false,
                message: "message is required",
            });
        }

        const quote = await QuoteModel.findById(req.params.id);

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
        } as any;
        quote.status = "RESPONDED";

        await quote.save();

        const updatedQuote = await QuoteModel.findById(quote._id)
            .populate("customerId", "fullName firstName email phone")
            .populate("adminResponse.respondedBy", "fullName firstName email");

        return res.json({
            success: true,
            payload: updatedQuote,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error replying to quote",
        });
    }
};