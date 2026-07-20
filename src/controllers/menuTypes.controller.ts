import { Request, Response } from "express";
import mongoose from "mongoose";
import MenuTypes from "../models/MenuTypes";
import Menu from "../models/Menu";
import Package from "../models/Package";

const isValidObjectId = (id: string): boolean => mongoose.Types.ObjectId.isValid(id);

const normalizeMenuCategoryArray = async (menuIds: string[]): Promise<void> => {
    if (menuIds.length === 0) {
        return;
    }

    const menus = await Menu.find({
        _id: {
            $in: menuIds,
        },
    }).select("menuCategory");

    for (const menu of menus) {
        const currentValue = (menu as any).menuCategory;

        if (Array.isArray(currentValue)) {
            continue;
        }

        if (
            currentValue instanceof mongoose.Types.ObjectId
        ) {
            (menu as any).menuCategory = [currentValue];
        } else if (
            currentValue &&
            typeof currentValue === "string" &&
            mongoose.Types.ObjectId.isValid(currentValue)
        ) {
            (menu as any).menuCategory = [
                new mongoose.Types.ObjectId(currentValue),
            ];
        } else {
            (menu as any).menuCategory = [];
        }

        await menu.save();
    }
};

export const createMenuType = async (req: Request, res: Response): Promise<any> => {
    try {
        const { title, description, packageId, menus = [] } = req.body;

        const normalizedTitle = typeof title === "string" ? title.trim() : "";
        const normalizedDescription = typeof description === "string" ? description.trim() : "";

        if (!normalizedTitle) {
            return res.status(400).json({
                success: false,
                message: "title is required",
            });
        }

        if (!normalizedDescription) {
            return res.status(400).json({
                success: false,
                message: "description is required",
            });
        }

        if (!packageId) {
            return res.status(400).json({
                success: false,
                message: "packageId is required",
            });
        }

        if (!isValidObjectId(packageId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid packageId",
            });
        }

        const packageExists = await Package.exists({ _id: packageId });
        if (!packageExists) {
            return res.status(404).json({
                success: false,
                message: "Package not found",
            });
        }

        if (!Array.isArray(menus)) {
            return res.status(400).json({
                success: false,
                message: "menus must be an array of menu IDs",
            });
        }

        const invalidMenuId = menus.find((menuId: string) => !isValidObjectId(menuId));
        if (invalidMenuId) {
            return res.status(400).json({
                success: false,
                message: `Invalid menu id: ${invalidMenuId}`,
            });
        }

        if (menus.length > 0) {
            const menuCount = await Menu.countDocuments({ _id: { $in: menus } });
            if (menuCount !== menus.length) {
                return res.status(404).json({
                    success: false,
                    message: "One or more menu IDs do not exist",
                });
            }
        }

        const menuTypes = await MenuTypes.create({
            title: normalizedTitle,
            description: normalizedDescription,
            packageId,
            menus,
        });

        if (menus.length > 0) {
            await normalizeMenuCategoryArray(menus);

            await Menu.updateMany(
                {
                    _id: {
                        $in: menus,
                    },
                },
                {
                    $addToSet: {
                        menuCategory: menuTypes._id,
                    },
                }
            );
        }

        const data = await MenuTypes.findById(menuTypes._id)
            .populate("packageId")
            .populate("menus");

        return res.status(201).json({
            success: true,
            data,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getMenuTypes = async (req: Request, res: Response): Promise<any> => {
    try {
        const {
            packageId,
            search,
            sortBy = "createdAt",
            sortOrder = "desc",
            page = "1",
            limit = "10",
        } = req.query;

        const filter: any = {};

        if (packageId) {
            if (!isValidObjectId(packageId as string)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid packageId",
                });
            }

            filter.packageId = packageId;
        }

        if (search) {
            const escapedSearch = String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").trim();

            if (escapedSearch) {
                filter.title = {
                    $regex: escapedSearch,
                    $options: "i",
                };
            }
        }

        const pageNumber = Math.max(Number(page), 1);
        const limitNumber = Math.max(Number(limit), 1);
        const skip = (pageNumber - 1) * limitNumber;

        const allowedSortFields = ["createdAt", "updatedAt", "title"];
        const sortField = allowedSortFields.includes(sortBy as string)
            ? (sortBy as string)
            : "createdAt";

        const sort: any = {
            [sortField]: sortOrder === "asc" ? 1 : -1,
        };

        const [data, total] = await Promise.all([
            MenuTypes.find(filter)
                .populate("packageId")
                .populate("menus")
                .sort(sort)
                .skip(skip)
                .limit(limitNumber),
            MenuTypes.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            count: data.length,
            total,
            page: pageNumber,
            totalPages: Math.ceil(total / limitNumber),
            limit: limitNumber,
            data,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getMenuType = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid MenuTypes ID",
            });
        }

        const data = await MenuTypes.findById(id)
            .populate("packageId")
            .populate("menus");

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "MenuTypes not found",
            });
        }

        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const updateMenuType = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { title, description, packageId, menus } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid MenuTypes ID",
            });
        }

        const menuType = await MenuTypes.findById(id);
        if (!menuType) {
            return res.status(404).json({
                success: false,
                message: "MenuTypes not found",
            });
        }

        const previousMenuIds = menuType.menus.map((menuId) => menuId.toString());

        if (title != null) {
            if (typeof title !== "string" || title.trim() === "") {
                return res.status(400).json({
                    success: false,
                    message: "title must be a non-empty string",
                });
            }

            menuType.title = title.trim();
        }

        if (description != null) {
            if (typeof description !== "string" || description.trim() === "") {
                return res.status(400).json({
                    success: false,
                    message: "description must be a non-empty string",
                });
            }

            menuType.description = description.trim();
        }

        if (packageId != null) {
            if (!isValidObjectId(packageId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid packageId",
                });
            }

            const packageExists = await Package.exists({ _id: packageId });
            if (!packageExists) {
                return res.status(404).json({
                    success: false,
                    message: "Package not found",
                });
            }

            menuType.packageId = packageId;
        }

        if (menus != null) {
            if (!Array.isArray(menus)) {
                return res.status(400).json({
                    success: false,
                    message: "menus must be an array of menu IDs",
                });
            }

            const invalidMenuId = menus.find((menuId: string) => !isValidObjectId(menuId));
            if (invalidMenuId) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid menu id: ${invalidMenuId}`,
                });
            }

            if (menus.length > 0) {
                const menuCount = await Menu.countDocuments({ _id: { $in: menus } });
                if (menuCount !== menus.length) {
                    return res.status(404).json({
                        success: false,
                        message: "One or more menu IDs do not exist",
                    });
                }
            }

            menuType.menus = menus;
        }

        await menuType.save();

        const updatedMenuIds = menuType.menus.map((menuId) => menuId.toString());
        const addedMenuIds = updatedMenuIds.filter(
            (menuId) => !previousMenuIds.includes(menuId)
        );
        const removedMenuIds = previousMenuIds.filter(
            (menuId) => !updatedMenuIds.includes(menuId)
        );

        if (addedMenuIds.length > 0) {
            await normalizeMenuCategoryArray(addedMenuIds);

            await Menu.updateMany(
                {
                    _id: {
                        $in: addedMenuIds,
                    },
                },
                {
                    $addToSet: {
                        menuCategory: menuType._id,
                    },
                }
            );
        }

        if (removedMenuIds.length > 0) {
            await normalizeMenuCategoryArray(removedMenuIds);

            await Menu.updateMany(
                {
                    _id: {
                        $in: removedMenuIds,
                    },
                },
                {
                    $pull: {
                        menuCategory: menuType._id,
                    },
                }
            );
        }

        const data = await MenuTypes.findById(id)
            .populate("packageId")
            .populate("menus");

        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const deleteMenuType = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid MenuTypes ID",
            });
        }

        const data = await MenuTypes.findByIdAndDelete(id);
        if (!data) {
            return res.status(404).json({
                success: false,
                message: "MenuTypes not found",
            });
        }

        if (data.menus.length > 0) {
            await normalizeMenuCategoryArray(data.menus.map((menuId) => menuId.toString()));

            await Menu.updateMany(
                {
                    _id: {
                        $in: data.menus,
                    },
                },
                {
                    $pull: {
                        menuCategory: data._id,
                    },
                }
            );
        }

        return res.status(200).json({
            success: true,
            message: "MenuTypes deleted successfully",
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const addMenuToMenuType = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id, menuId } = req.params;

        if (!isValidObjectId(id) || !isValidObjectId(menuId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ID supplied",
            });
        }

        const menuType = await MenuTypes.findById(id);
        if (!menuType) {
            return res.status(404).json({
                success: false,
                message: "MenuTypes not found",
            });
        }

        const menuExists = await Menu.exists({ _id: menuId });
        if (!menuExists) {
            return res.status(404).json({
                success: false,
                message: "Menu not found",
            });
        }

        if (!menuType.menus.some((menu) => menu.toString() === menuId)) {
            menuType.menus.push(new mongoose.Types.ObjectId(menuId));
            await menuType.save();

            await normalizeMenuCategoryArray([menuId]);

            await Menu.updateOne(
                {
                    _id: menuId,
                },
                {
                    $addToSet: {
                        menuCategory: menuType._id,
                    },
                }
            );
        }

        const data = await MenuTypes.findById(id)
            .populate("packageId")
            .populate("menus");

        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const removeMenuFromMenuType = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id, menuId } = req.params;

        if (!isValidObjectId(id) || !isValidObjectId(menuId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ID supplied",
            });
        }

        const menuType = await MenuTypes.findById(id);
        if (!menuType) {
            return res.status(404).json({
                success: false,
                message: "MenuTypes not found",
            });
        }

        menuType.menus = menuType.menus.filter((menu) => menu.toString() !== menuId);
        await menuType.save();

        await normalizeMenuCategoryArray([menuId]);

        await Menu.updateOne(
            {
                _id: menuId,
            },
            {
                $pull: {
                    menuCategory: menuType._id,
                },
            }
        );

        const data = await MenuTypes.findById(id)
            .populate("packageId")
            .populate("menus");

        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const updateMenuOnMenuType = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id, menuId } = req.params;
        const { newMenuId } = req.body;

        if (!isValidObjectId(id) || !isValidObjectId(menuId) || !isValidObjectId(newMenuId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ID supplied",
            });
        }

        const menuType = await MenuTypes.findById(id);
        if (!menuType) {
            return res.status(404).json({
                success: false,
                message: "MenuTypes not found",
            });
        }

        const newMenuExists = await Menu.exists({ _id: newMenuId });
        if (!newMenuExists) {
            return res.status(404).json({
                success: false,
                message: "New menu not found",
            });
        }

        const index = menuType.menus.findIndex((menu) => menu.toString() === menuId);
        if (index < 0) {
            return res.status(404).json({
                success: false,
                message: "Menu to replace not found in this MenuTypes record",
            });
        }

        menuType.menus[index] = new mongoose.Types.ObjectId(newMenuId);
        await menuType.save();

        await normalizeMenuCategoryArray([menuId, newMenuId]);

        await Menu.updateOne(
            {
                _id: menuId,
            },
            {
                $pull: {
                    menuCategory: menuType._id,
                },
            }
        );

        await Menu.updateOne(
            {
                _id: newMenuId,
            },
            {
                $addToSet: {
                    menuCategory: menuType._id,
                },
            }
        );

        const data = await MenuTypes.findById(id)
            .populate("packageId")
            .populate("menus");

        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
