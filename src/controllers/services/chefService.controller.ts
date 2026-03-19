// controllers/chefService.controller.ts

import { Request, Response } from "express";
import { ChefService } from "../../models/ChefService";



/**
 * CREATE CHEF SERVICE
 */
export const createChefService = async (req: Request, res: Response): Promise<any> => {
    try {
        // Accept either a single serviceId or an array of serviceIds
        const { chefId, serviceId, serviceIds, isAvailable } = req.body;

        const ids: string[] = Array.isArray(serviceIds)
            ? serviceIds
            : (serviceId ? [serviceId] : []);

        if (!chefId || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'chefId and at least one serviceId are required' });
        }

        // Create each chef-service entry, but tolerate duplicates (unique index on chefId+serviceId)
        const results = await Promise.allSettled(
            ids.map((sid: string) => ChefService.create({ chefId, serviceId: sid, isAvailable }))
        );

        const created = results
            .filter((r: any) => r.status === 'fulfilled')
            .map((r: any) => r.value);

        const dupCount = results.filter((r: any) => r.status === 'rejected' && r.reason && r.reason.code === 11000).length;

        return res.status(201).json({
            success: true,
            message: `Chef services created${dupCount ? ` (${dupCount} skipped due to duplicates)` : ''}`,
            payload: created
        });

    } catch (error: any) {

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "This chef already offers this service"
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



/**
 * GET ALL CHEF SERVICES
 * Supports:
 * - pagination
 * - search by service name
 * - filter by availability
 */
export const getChefServices = async (req: Request, res: Response): Promise<any> => {
    try {

        const {
            page = 1,
            limit = 10,
            isAvailable,
            chefId
        } = req.query;

        const query: any = {};

        if (isAvailable !== undefined) {
            query.isAvailable = isAvailable;
        }

        if (chefId) {
            query.chefId = chefId;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const chefServices = await ChefService
            .find(query)
            .populate("chefId")
            .populate("serviceId")
            .limit(Number(limit))
            .skip(skip)
            .sort({ createdAt: -1 });

        const total = await ChefService.countDocuments(query);

        return res.json({
            success: true,
            payload: chefServices,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit))
            }
        });

    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



/**
 * GET SINGLE CHEF SERVICE
 */
export const getChefService = async (req: Request, res: Response): Promise<any> => {
    try {

        const chefService = await ChefService
            .findById(req.params.id)
            .populate("chefId")
            .populate("serviceId");

        if (!chefService) {
            return res.status(404).json({
                success: false,
                message: "Chef service not found"
            });
        }

        return res.json({
            success: true,
            payload: chefService
        });

    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



/**
 * UPDATE CHEF SERVICE
 */
export const updateChefService = async (req: Request, res: Response): Promise<any> => {
    try {

        const chefService = await ChefService.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!chefService) {
            return res.status(404).json({
                success: false,
                message: "Chef service not found"
            });
        }

        return res.json({
            success: true,
            message: "Chef service updated successfully",
            payload: chefService
        });

    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



/**
 * DELETE CHEF SERVICE
 */
export const deleteChefService = async (req: Request, res: Response): Promise<any> => {
    try {

        const chefService = await ChefService.findByIdAndDelete(req.params.id);

        if (!chefService) {
            return res.status(404).json({
                success: false,
                message: "Chef service not found"
            });
        }

        return res.json({
            success: true,
            message: "Chef service deleted successfully"
        });

    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



/**
 * TOGGLE AVAILABILITY
 */
export const toggleChefServiceAvailability = async (req: Request, res: Response): Promise<any> => {
    try {

        const chefService = await ChefService.findById(req.params.id);

        if (!chefService) {
            return res.status(404).json({
                success: false,
                message: "Chef service not found"
            });
        }

        chefService.isAvailable = !chefService.isAvailable;

        await chefService.save();

        return res.json({
            success: true,
            message: "Availability updated",
            payload: chefService
        });

    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



/**
 * GET SERVICES BY CHEF
 */
export const getServicesByChef = async (req: Request, res: Response): Promise<any> => {
    try {

        const { chefId } = req.params;

        const services = await ChefService
            .find({ chefId })
            .populate("serviceId");

        return res.json({
            success: true,
            payload: services
        });

    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};