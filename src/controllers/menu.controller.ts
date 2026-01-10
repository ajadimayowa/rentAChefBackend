import { Request, Response } from "express";
import Menu from "../models/Menu";
import { Types } from "mongoose";

/**
 * CREATE MENU
 */
export const createMenu = async (req: Request, res: Response): Promise<any> => {
  try {
    const menuPic = req.file as any; // multer file
    const { chef, title, items, basePrice } = req.body;

    if (!chef || !title || !menuPic || !basePrice) {
      return res.status(400).json({ message: "Chef, title,picture and base price are required" });
    }

    const menu = await Menu.create({
      chef,
      title,
      menuPic: menuPic?.location || menuPic?.path || "", // depending on S3 or local
      basePrice
    });

    return res.status(201).json({
      success: true,
      message: "Menu created successfully",
      data: menu,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};



/**
 * GET ALL MENUS
 */
export const getMenus = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const {
      chefId,
      price,
      name,
      page = "1",
      limit = "10",
    } = req.query;

    const filter: any = {};

    // Filter by chef
    if (chefId) {
      filter.chef = chefId;
    }

    // Filter by max price
    if (price) {
      filter.basePrice = { $lte: Number(price) };
    }

    // Filter by menu name (case-insensitive)
    if (name) {
      filter.title = { $regex: name, $options: "i" };
    }

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.max(Number(limit), 1);
    const skip = (pageNumber - 1) * limitNumber;

    const [menus, total] = await Promise.all([
      Menu.find(filter)
        .populate("chef", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),
      Menu.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      payload: menus,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



/**
 * GET SINGLE MENU
 */
export const getSingleMenu = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid menu ID" });
    }

    const menu = await Menu.findById(id).populate("chef", "name email");

    if (!menu) {
      return res.status(404).json({ message: "Menu not found" });
    }

    return res.status(200).json({success:true, payload: menu });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};



/**
 * UPDATE MENU
 */
export const updateMenu = async (req: Request, res: Response) :Promise<any> => {
  const { id } = req.params;

  const menu = await Menu.findByIdAndUpdate(
    id,
    {
      title: req.body.title,
      basePrice: req.body.basePrice,
      menuPic: req.body.menuPic,
    },
    { new: true, runValidators: true }
  );

  if (!menu) {
    return res.status(404).json({ success: false, message: 'Menu not found' });
  }

  res.status(200).json({ success: true, payload: menu });
};



/**
 * DELETE MENU
 */
export const deleteMenu = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid menu ID" });
    }

    const deletedMenu = await Menu.findByIdAndDelete(id);

    if (!deletedMenu) {
      return res.status(404).json({ message: "Menu not found" });
    }

    return res.status(200).json({ message: "Menu deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const addItemsToMenu = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { menuId, items } = req.body;

    if (!menuId) {
      return res.status(400).json({
        success: false,
        message: 'menuId is required',
      });
    }

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Items must be an array',
      });
    }

    if (items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Menu must have at least one item',
      });
    }

    const formattedItems = items.map((item) => ({
      name: item.name,
      price: Number(item.price),
      description: item.description,
    }));

    const menu = await Menu.findByIdAndUpdate(
      menuId,
      { items: formattedItems },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menu not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Menu items updated successfully',
      payload: menu,
    });
  } catch (error: any) {
    console.error('Replace items error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update menu items',
    });
  }
};