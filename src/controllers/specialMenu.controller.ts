import { Request, Response } from "express";
import { SpecialMenu } from "../models/SpecialMenu";

/** CREATE */
export const createSpecialMenu = async (req: Request, res: Response):Promise<any> => {
    try {
        const menuPic = req.file as any; // multer file
        const {
            title,
            description,
            minimumGuests,
            numberOfDishes,
            price,
        } = req.body;

        /** Basic validation */
        if (!title || !minimumGuests || !numberOfDishes || !price) {
            return res.status(400).json({
                success: false,
                message: "title, minimumGuests, numberOfDishes and price are required",
            });
        }

        const specialMenu = await SpecialMenu.create({
            title,
            description,
            minimumGuests: Number(minimumGuests),
            numberOfDishes: Number(numberOfDishes),
            image: menuPic?.location || menuPic?.path || "", // depending on S3 or local
            price: Number(price),
        });

        res.status(201).json({
            success: true,
            data: specialMenu,
        });
    } catch (error: any) {
        /** Mongoose validation errors */
        if (error.name === "ValidationError") {
            return res.status(400).json({
                success:false,
                message: "Validation failed",
                errors: Object.values(error.errors).map(
                    (err: any) => err.message
                ),
            });
        }

        res.status(500).json({
            success:false,
            message: "Failed to create special menu",
            error: error.message,
        });
    }
};

/** GET ALL */
export const getAllSpecialMenus = async (req: Request, res: Response) => {
    try {
        const parsedPage = Number(req.query.page);
        const parsedLimit = Number(req.query.limit);

        const page = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;
        const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.floor(parsedLimit) : 10;

        const rawSearch = req.query.name ?? req.query.search ?? req.query.q;
        const search = typeof rawSearch === "string" ? rawSearch.trim() : "";

        const filter: Record<string, any> = {};
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        const skip = (page - 1) * limit;

        const [menus, total] = await Promise.all([
            SpecialMenu.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            SpecialMenu.countDocuments(filter),
        ]);

        const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

        res.status(200).json({
            success: true,
            data: menus,
            payload: menus,
            meta: {
                total,
                limit,
                page,
                totalPages,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success:false, message: error.message });
    }
};

/** GET ONE */
export const getSpecialMenuById = async (req: Request, res: Response):Promise<any> => {
    try {
        const menu = await SpecialMenu.findById(req.params.id);
        if (!menu) {
            return res.status(404).json({ success:false, message: "Special menu not found" });
        }
        res.status(200).json({success:true,data:menu});
    } catch (error: any) {
        res.status(400).json({ success:false, message: error.message });
    }
};

/** UPDATE */
export const updateSpecialMenu = async (req: Request, res: Response):Promise<any> => {
    try {
        const menuPic = req.file as any;
        const updatePayload: any = { ...req.body };

        if (menuPic?.location || menuPic?.path) {
            updatePayload.image = menuPic?.location || menuPic?.path;
        }

        if (Object.prototype.hasOwnProperty.call(updatePayload, "minimumGuests")) {
            updatePayload.minimumGuests = Number(updatePayload.minimumGuests);
        }
        if (Object.prototype.hasOwnProperty.call(updatePayload, "numberOfDishes")) {
            updatePayload.numberOfDishes = Number(updatePayload.numberOfDishes);
        }
        if (Object.prototype.hasOwnProperty.call(updatePayload, "price")) {
            updatePayload.price = Number(updatePayload.price);
        }

        const menu = await SpecialMenu.findByIdAndUpdate(
            req.params.id,
            updatePayload,
            { new: true, runValidators: true }
        );

        if (!menu) {
            return res.status(404).json({ success:false, message: "Special menu not found" });
        }

        res.status(200).json({success:true,data:menu});
    } catch (error: any) {
        res.status(400).json({success:false, message: error.message });
    }
};

/** DELETE */
export const deleteSpecialMenu = async (req: Request, res: Response):Promise<any> => {
    try {
        const menu = await SpecialMenu.findByIdAndDelete(req.params.id);

        if (!menu) {
            return res.status(404).json({success:false, message: "Special menu not found" });
        }

        res.status(200).json({success:true, message: "Special menu deleted successfully" });
    } catch (error: any) {
        res.status(400).json({ success:false, message: error.message });
    }
};

export const addProcurements = async (req: Request, res: Response):Promise<any> => {
  try {
    const procurements =
      typeof req.body.procurements === "string"
        ? JSON.parse(req.body.procurements)
        : req.body.procurements;

    const menu = await SpecialMenu.findByIdAndUpdate(
            req.params.menuId,
      { $push: { procurements: { $each: procurements } } },
      { new: true, runValidators: true }
    );

    if (!menu) {
            return res.status(404).json({ success:false, message: "Special menu not found" });
    }

    res.status(200).json({
      success: true,
      data: menu,
    });
  } catch (error: any) {
    res.status(400).json({
            success: false,
      message: "Failed to add procurements",
      error: error.message,
    });
  }
};