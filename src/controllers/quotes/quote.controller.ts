import { Request, Response } from "express";
import Quote from "../../models/Quote"


// CREATE QUOTE
export const createQuote = async (req: Request, res: Response): Promise<any> => {
    try {
        const { title, description, clientId } = req.body;

        const quote = await Quote.create({
            title,
            description,
            clientId,
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
export const getQuotes = async (_req: Request, res: Response): Promise<any> => {
    try {
        const quotes = await Quote.find()
            .populate("clientId")
            .sort({ createdAt: -1 });

        return res.json({
            success: true,
            payload: quotes,
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
        const quote = await Quote.findById(req.params.id).populate("clientId");

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: "Quote not found",
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
        const quote = await Quote.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: "Quote not found",
            });
        }

        return res.json({
            success: true,
            payload: quote,
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
        const quote = await Quote.findByIdAndDelete(req.params.id);

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: "Quote not found",
            });
        }

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