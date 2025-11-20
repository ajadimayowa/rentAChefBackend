import { Request, Response } from "express";
import Menu from "../models/Menu";
import { Types } from "mongoose";

/**
 * CREATE MENU
 */
export const createMenu = async (req: Request, res: Response): Promise<any> => {
  try {
    const { chef, title, items } = req.body;

    if (!chef || !title || !items || !items.length) {
      return res.status(400).json({ message: "Chef, title and items are required" });
    }

    const menu = await Menu.create({
      chef,
      title,
      items,
    });

    return res.status(201).json({
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
export const getAllMenus = async (req: Request, res: Response): Promise<any> => {
  try {
    const menus = await Menu.find()
      .populate("chef", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ data: menus });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
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

    return res.status(200).json({ data: menu });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};



/**
 * UPDATE MENU
 */
export const updateMenu = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { title, items } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid menu ID" });
    }

    const updatedMenu = await Menu.findByIdAndUpdate(
      id,
      { title, items },
      { new: true, runValidators: true }
    );

    if (!updatedMenu) {
      return res.status(404).json({ message: "Menu not found" });
    }

    return res.status(200).json({
      message: "Menu updated successfully",
      data: updatedMenu,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
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