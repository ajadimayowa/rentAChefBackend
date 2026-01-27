import { Request, Response } from "express";
import { Menu } from "../models/Menu";

/* ================= CREATE MENU ================= */
export const createMenu = async (req: Request, res: Response): Promise<any>  => {
  
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Menu picture is required" });
    }

    const menuPicFile = req.file as any; // multer file

    const weeks = JSON.parse(req.body.weeks);

    const menu = await Menu.create({
      chefId: req.body.chefId,
      month: req.body.month,
      createdBy: req.body.createdBy,
      weeks,
      menuPic: menuPicFile?.location || menuPicFile?.path || "",
    });

    res.status(201).json(menu);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Menu already exists for this chef and month",
      });
    }
    res.status(500).json({ message: error.message });
  }
};

/* ================= GET ALL MENUS ================= */
export const getMenus = async (req: Request, res: Response): Promise<any> => {
  const { chefId, month, approved } = req.query;

  const filter: any = {};
  if (chefId) filter.chefId = chefId;
  if (month) filter.month = month;
  if (approved !== undefined) filter.approved = approved;

  const menus = await Menu.find(filter)
    .populate("chefId", "name")
    .sort({ createdAt: -1 });

  res.json({success:true,payload:menus});
};

/* ================= GET MENU BY ID ================= */
export const getMenuById = async (req: Request, res: Response): Promise<any>  => {
  const menu = await Menu.findById(req.params.id)
    .populate("chefId", "name");

  if (!menu) {
    return res.status(404).json({ message: "Menu not found" });
  }

  res.json(menu);
};

/* ================= GET MENU BY CHEF & MONTH ================= */
export const getMenuByChefAndMonth = async (req: Request, res: Response): Promise<any> => {
  try {
    const { chefId, month } = req.query;

    const menu = await Menu.findOne({ chefId, month });

    if (!menu) {
      return res.status(404).json({ message: "Menu not found" });
    }

    res.json({ success: true, payload: menu });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= UPDATE MENU ================= */
export const updateMenu = async (req: Request, res: Response): Promise<any> => {

  try {
    const updateData: any = {};
    const menuPicFile = req.file as any; // multer file

    if (req.body.weeks) {
      updateData.weeks = JSON.parse(req.body.weeks);
    }

    if (req.body.month) updateData.month = req.body.month;

    if (req.file) {
      updateData.menuPic = menuPicFile?.location || menuPicFile?.path || ""
    }

    const menu = await Menu.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!menu) {
      return res.status(404).json({ message: "Menu not found" });
    }

    res.json(menu);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= APPROVE MENU (ADMIN) ================= */
export const approveMenu = async (req: Request, res: Response) => {
  const menu = await Menu.findByIdAndUpdate(
    req.params.id,
    { approved: true },
    { new: true }
  );

  if (!menu) {
    return res.status(404).json({ message: "Menu not found" });
  }

  res.json(menu);
};


export const addProcurement = async (req: Request, res: Response): Promise<any> => {
  const { procurement } = req.body;

  const menu = await Menu.findByIdAndUpdate(
    req.params.id,
    {
      $push: { procurement: { $each: procurement } }
    },
    { new: true }
  );

  if (!menu) {
    return res.status(404).json({ message: "Menu not found" });
  }

  res.json(menu);
};


export const removeProcurementItem = async (req: Request, res: Response): Promise<any> => {
  try {
    const menu = await Menu.findByIdAndUpdate(
      req.params.menuId,
      {
        $pull: { procurement: { title: req.params.title } },
      },
      { new: true }
    );

    if (!menu) {
      return res.status(404).json({ message: "Menu not found" });
    }

    res.json({ success: true, data: menu });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};



/* ================= DELETE MENU ================= */
export const deleteMenu = async (req: Request, res: Response): Promise<any> => {
  const menu = await Menu.findByIdAndDelete(req.params.id);

  if (!menu) {
    return res.status(404).json({ message: "Menu not found" });
  }

  res.json({ message: "Menu deleted successfully" });
};