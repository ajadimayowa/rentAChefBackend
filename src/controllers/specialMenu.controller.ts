import { Request, Response } from "express";
import { SpecialMenu } from "../models/SpecialMenu";

/** CREATE */
export const createSpecialMenu = async (req: Request, res: Response):Promise<any> => {
    try {
        const menuPic = req.file as any; // multer file
        const {
            title,
            description,
            price,
        } = req.body;

        /** Basic validation */
        if (!title || !price) {
            return res.status(400).json({
                message: "Title and price are required",
            });
        }

        const specialMenu = await SpecialMenu.create({
            title,
            description,
            image: menuPic?.location || menuPic?.path || "", // depending on S3 or local
            price,
        });

        res.status(201).json({
            success: true,
            data: specialMenu,
        });
    } catch (error: any) {
        /** Mongoose validation errors */
        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: "Validation failed",
                errors: Object.values(error.errors).map(
                    (err: any) => err.message
                ),
            });
        }

        res.status(500).json({
            message: "Failed to create special menu",
            error: error.message,
        });
    }
};

/** GET ALL */
export const getAllSpecialMenus = async (_: Request, res: Response) => {
    try {
        const menus = await SpecialMenu.find().sort({ createdAt: -1 });
        res.status(200).json({success:true,payload:menus});
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

/** GET ONE */
export const getSpecialMenuById = async (req: Request, res: Response):Promise<any> => {
    try {
        const menu = await SpecialMenu.findById(req.params.id);
        if (!menu) {
            return res.status(404).json({ message: "Special menu not found" });
        }
        res.status(200).json({success:true,payload:menu});
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

/** UPDATE */
export const updateSpecialMenu = async (req: Request, res: Response):Promise<any> => {
    try {
        const menu = await SpecialMenu.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!menu) {
            return res.status(404).json({ message: "Special menu not found" });
        }

        res.status(200).json(menu);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

/** DELETE */
export const deleteSpecialMenu = async (req: Request, res: Response):Promise<any> => {
    try {
        const menu = await SpecialMenu.findByIdAndDelete(req.params.id);

        if (!menu) {
            return res.status(404).json({ message: "Special menu not found" });
        }

        res.status(200).json({ message: "Special menu deleted successfully" });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const addProcurements = async (req: Request, res: Response):Promise<any> => {
  try {
    const procurements =
      typeof req.body.procurements === "string"
        ? JSON.parse(req.body.procurements)
        : req.body.procurements;

    const menu = await SpecialMenu.findByIdAndUpdate(
      req.params.id,
      { $push: { procurements: { $each: procurements } } },
      { new: true, runValidators: true }
    );

    if (!menu) {
      return res.status(404).json({ message: "Special menu not found" });
    }

    res.status(200).json({
      success: true,
      data: menu,
    });
  } catch (error: any) {
    res.status(400).json({
      message: "Failed to add procurements",
      error: error.message,
    });
  }
};