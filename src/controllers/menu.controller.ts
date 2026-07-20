import { Request, Response } from "express";
import Menu, { MenuClass, PricingModel } from "../models/Menu";
import mongoose from "mongoose";
import MenuTypes from "../models/MenuTypes";

const ALLOWED_MENU_CLASSES = ["nigerian", "continental"] as const;
const ALLOWED_PRICING_MODELS = ["perhead", "plater"] as const;

const normalizeOptionalEnumInput = (
    value: unknown
): string | undefined => {
    if (value === undefined || value === null) {
        return undefined;
    }

    const normalizedValue = String(value).trim().toLowerCase();
    return normalizedValue === "" ? undefined : normalizedValue;
};

const normalizeMenuCategoryResponse = (value: unknown): unknown[] => {
    if (Array.isArray(value)) {
        return value;
    }

    if (value == null) {
        return [];
    }

    return [value];
};

const parseMenuCategoryIds = (
    value: unknown
): { ids?: string[]; error?: string } => {
    if (value === undefined) {
        return {};
    }

    let parsed = value;

    if (typeof parsed === "string") {
        const trimmed = parsed.trim();

        if (trimmed === "") {
            return { ids: [] };
        }

        if (trimmed.startsWith("[")) {
            try {
                parsed = JSON.parse(trimmed);
            } catch {
                return { error: "menuCategory must be an array of MenuTypes IDs." };
            }
        } else {
            parsed = [trimmed];
        }
    }

    if (!Array.isArray(parsed)) {
        return { error: "menuCategory must be an array of MenuTypes IDs." };
    }

    const ids = parsed.map((item) => String(item).trim()).filter(Boolean);

    const invalidId = ids.find((id) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidId) {
        return { error: `Invalid menuCategory id: ${invalidId}` };
    }

    return { ids: Array.from(new Set(ids)) };
};

const normalizeGroceries = (value: unknown): any[] => {
    return Array.isArray(value) ? value : [];
};

const calculateTotalGroceryCost = (groceries: unknown): number => {
    return normalizeGroceries(groceries).reduce(
        (sum: number, grocery: any) => sum + Number(grocery?.unitPrice || 0),
        0
    );
};

export const createMenu = async (
    req: Request,
    res: Response
): Promise<any> => {
    try {
        const body = req.body ?? {};

        const {
            menuCreatorType,
            title,
            description,
            relatedServiceId,
            isSignatureMenu,
            menuType,
            menuClass,
            pricingModel,
            menuCategory,
            pricePerHead,
            chefId,
        } = body;

        const uploadedFile = req.file as any;

        const { ids: menuCategoryIds, error: menuCategoryError } =
            parseMenuCategoryIds(menuCategory);

        if (menuCategoryError) {
            return res.status(400).json({
                success: false,
                message: menuCategoryError,
            });
        }

        if (menuCategoryIds && menuCategoryIds.length > 0) {
            const menuTypesCount = await MenuTypes.countDocuments({
                _id: { $in: menuCategoryIds },
            });

            if (menuTypesCount !== menuCategoryIds.length) {
                return res.status(404).json({
                    success: false,
                    message: "One or more menuCategory IDs do not exist.",
                });
            }
        }

        const samplePicture =
            uploadedFile?.location ||
            uploadedFile?.path ||
            uploadedFile?.filename ||
            undefined;

        const normalizedMenuClass = normalizeOptionalEnumInput(menuClass);
        const normalizedPricingModel = normalizeOptionalEnumInput(pricingModel);

        if (
            normalizedMenuClass !== undefined &&
            !ALLOWED_MENU_CLASSES.includes(normalizedMenuClass as (typeof ALLOWED_MENU_CLASSES)[number])
        ) {
            return res.status(400).json({
                success: false,
                message: `menuClass must be one of: ${ALLOWED_MENU_CLASSES.join(", ")}.`,
            });
        }

        if (
            normalizedPricingModel !== undefined &&
            !ALLOWED_PRICING_MODELS.includes(normalizedPricingModel as (typeof ALLOWED_PRICING_MODELS)[number])
        ) {
            return res.status(400).json({
                success: false,
                message: `pricingModel must be one of: ${ALLOWED_PRICING_MODELS.join(", ")}.`,
            });
        }

        // Normalize chefId
        const normalizedChefId =
            typeof chefId === "string" && chefId.trim() === ""
                ? undefined
                : chefId;

        // Validate chefId only for chef menus
        if (menuCreatorType === "chef") {
            if (!normalizedChefId) {
                return res.status(400).json({
                    success: false,
                    message: "chefId is required for chef menus.",
                });
            }

            if (!mongoose.Types.ObjectId.isValid(normalizedChefId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid chefId.",
                });
            }
        }

        const menuData: any = {
            menuCreatorType,
            title,
            description,
            relatedServiceId,
            samplePicture,
            menuType,
            menuCategory:
                menuCategoryIds?.map((id) => new mongoose.Types.ObjectId(id)) || [],
            pricePerHead: Number(pricePerHead),
        };

        if (normalizedMenuClass !== undefined) {
            menuData.menuClass = normalizedMenuClass;
        }

        if (normalizedPricingModel !== undefined) {
            menuData.pricingModel = normalizedPricingModel;
        }

        if (samplePicture) {
            menuData.samplePicture = samplePicture;
        }

        if (menuCreatorType === "chef") {
            menuData.chefId = normalizedChefId;

            menuData.isSignatureMenu =
                isSignatureMenu === true ||
                isSignatureMenu === "true";
        } else {
            // Organization menus don't use chefId
            menuData.isSignatureMenu = false;
        }

        const menu = await Menu.create(menuData);

        if (menuCategoryIds && menuCategoryIds.length > 0) {
            await MenuTypes.updateMany(
                { _id: { $in: menuCategoryIds } },
                {
                    $addToSet: {
                        menus: menu._id,
                    },
                }
            );
        }

        return res.status(201).json({
            success: true,
            message: "Menu created successfully.",
            data: menu,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getMenus = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const {
      chefId,
      isSignatureMenu,
      hasGroceries,
      packageId,
      menuCreatorType,
      menuType,
            menuClass,
            pricingModel,
      menuCategory,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = "1",
      limit = "10",
    } = req.query;

    const filter: any = {};
    const andConditions: any[] = [];

    // Chef
    if (chefId) {
      if (!mongoose.Types.ObjectId.isValid(chefId as string)) {
        return res.status(400).json({
          success: false,
          message: "Invalid chefId.",
        });
      }

      filter.chefId = chefId;
    }

    // Package
    if (packageId) {
      if (!mongoose.Types.ObjectId.isValid(packageId as string)) {
        return res.status(400).json({
          success: false,
          message: "Invalid packageId.",
        });
      }

            filter.packages = packageId;
    }

    // Menu creator
    if (menuCreatorType) {
      filter.menuCreatorType = menuCreatorType;
    }

    // Signature menu
    if (isSignatureMenu !== undefined) {
      filter.isSignatureMenu = String(isSignatureMenu).toLowerCase() === "true";
    }

    // Menu type
    if (menuType) {
      filter.menuType = menuType;
    }

        if (menuClass !== undefined) {
            const normalizedMenuClass = normalizeOptionalEnumInput(menuClass);

            if (
                normalizedMenuClass !== undefined &&
                !ALLOWED_MENU_CLASSES.includes(
                    normalizedMenuClass as (typeof ALLOWED_MENU_CLASSES)[number]
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: `menuClass must be one of: ${ALLOWED_MENU_CLASSES.join(", ")}.`,
                });
            }

            if (normalizedMenuClass !== undefined) {
                filter.menuClass = normalizedMenuClass;
            }
        }

        if (pricingModel !== undefined) {
            const normalizedPricingModel = normalizeOptionalEnumInput(pricingModel);

            if (
                normalizedPricingModel !== undefined &&
                !ALLOWED_PRICING_MODELS.includes(
                    normalizedPricingModel as (typeof ALLOWED_PRICING_MODELS)[number]
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: `pricingModel must be one of: ${ALLOWED_PRICING_MODELS.join(", ")}.`,
                });
            }

            if (normalizedPricingModel !== undefined) {
                filter.pricingModel = normalizedPricingModel;
            }
        }

    // Menu category
        if (menuCategory) {
            const categoryQuery = String(menuCategory).trim();
            const categoryIds = categoryQuery
                .split(",")
                .map((id) => id.trim())
                .filter(Boolean);

            if (categoryIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid menuCategory.",
                });
            }

            const categoryObjectIds = categoryIds.map(
                (id) => new mongoose.Types.ObjectId(id)
            );

            andConditions.push({
                $or: [
                    { menuCategory: { $in: categoryObjectIds } },
                    { menuCategory: { $in: categoryIds } },
                ],
            });
        }

    // Search title and description
        if (search) {
            andConditions.push({
                $or: [
                    {
                        title: {
                            $regex: search,
                            $options: "i",
                        },
                    },
                    {
                        description: {
                            $regex: search,
                            $options: "i",
                        },
                    },
                ],
            });
        }

    // Grocery filter
    if (hasGroceries !== undefined) {
      const hasItems = String(hasGroceries).toLowerCase() === "true";

      filter.$expr = hasItems
        ? { $gt: [{ $size: "$groceries" }, 0] }
        : { $eq: [{ $size: "$groceries" }, 0] };
    }

        if (andConditions.length > 0) {
            filter.$and = andConditions;
        }

        // Pagination
    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.max(Number(limit), 1);
    const skip = (pageNumber - 1) * limitNumber;

    // Allowed sorting fields
    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "title",
      "pricePerHead",
      "totalGroceryCost",
    ];

    const sortField = allowedSortFields.includes(sortBy as string)
      ? (sortBy as string)
      : "createdAt";

    const sort: any = {
      [sortField]: sortOrder === "asc" ? 1 : -1,
    };

        const [menus, total] = await Promise.all([
      Menu.find(filter)
        .populate("chefId")
        .populate("packages")
                .populate("menuCategory", "title description packageId")
        .sort(sort)
        .skip(skip)
        .limit(limitNumber),
      Menu.countDocuments(filter),
    ]);

        const data = menus.map((menu) => {
                const item = menu.toJSON() as any;
                item.menuCategory = normalizeMenuCategoryResponse(item.menuCategory);
                return item;
        });

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

export const getMenu = async (req: Request, res: Response): Promise<any> => {
    try {
        const menu = await Menu.findById(req.params.id)
            .populate("chefId")
            .populate("packages")
            .populate("menuCategory", "title description packageId pricingModel menuClass");

        if (!menu)
            return res.status(404).json({
                success: false,
                message: "Menu not found",
            });

        const data = menu.toJSON() as any;
        data.menuCategory = normalizeMenuCategoryResponse(data.menuCategory);

        return res.json({
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

export const updateMenu = async (
    req: Request,
    res: Response
): Promise<any> => {
    try {
        const menu = await Menu.findById(req.params.id);

        if (!menu) {
            return res.status(404).json({
                success: false,
                message: "Menu not found",
            });
        }

        const body = req.body ?? {};

        const {
            menuCreatorType,
            title,
            description,
            isSignatureMenu,
            menuType,
            menuClass,
            pricingModel,
            menuCategory,
            pricePerHead,
            chefId,
        } = body;

        const previousMenuTypeIds = menu.menuCategory.map((id) => id.toString());

        if (menuCreatorType !== undefined) {
            menu.menuCreatorType = menuCreatorType;
        }

        if (title !== undefined) {
            menu.title = title;
        }

        if (description !== undefined) {
            menu.description = description;
        }

        if (isSignatureMenu !== undefined) {
            menu.isSignatureMenu =
                isSignatureMenu === true || isSignatureMenu === "true";
        }

        if (menuType !== undefined) {
            menu.menuType = menuType;
        }

        if (menuClass !== undefined) {
            const normalizedMenuClass = normalizeOptionalEnumInput(menuClass);

            if (
                normalizedMenuClass !== undefined &&
                !ALLOWED_MENU_CLASSES.includes(normalizedMenuClass as (typeof ALLOWED_MENU_CLASSES)[number])
            ) {
                return res.status(400).json({
                    success: false,
                    message: `menuClass must be one of: ${ALLOWED_MENU_CLASSES.join(", ")}.`,
                });
            }

            menu.menuClass = normalizedMenuClass as MenuClass | undefined;
        }

        if (pricingModel !== undefined) {
            const normalizedPricingModel = normalizeOptionalEnumInput(pricingModel);

            if (
                normalizedPricingModel !== undefined &&
                !ALLOWED_PRICING_MODELS.includes(normalizedPricingModel as (typeof ALLOWED_PRICING_MODELS)[number])
            ) {
                return res.status(400).json({
                    success: false,
                    message: `pricingModel must be one of: ${ALLOWED_PRICING_MODELS.join(", ")}.`,
                });
            }

            menu.pricingModel = normalizedPricingModel as PricingModel | undefined;
        }

        if (menuCategory !== undefined) {
            const { ids: menuCategoryIds, error: menuCategoryError } =
                parseMenuCategoryIds(menuCategory);

            if (menuCategoryError) {
                return res.status(400).json({
                    success: false,
                    message: menuCategoryError,
                });
            }

            if (menuCategoryIds && menuCategoryIds.length > 0) {
                const menuTypesCount = await MenuTypes.countDocuments({
                    _id: { $in: menuCategoryIds },
                });

                if (menuTypesCount !== menuCategoryIds.length) {
                    return res.status(404).json({
                        success: false,
                        message: "One or more menuCategory IDs do not exist.",
                    });
                }
            }

            menu.menuCategory =
                menuCategoryIds?.map((id) => new mongoose.Types.ObjectId(id)) || [];
        }

        if (pricePerHead !== undefined) {
            menu.pricePerHead = Number(pricePerHead);
        }

        if (chefId !== undefined) {
            menu.chefId = chefId;
        }

        if (body.packageTypes !== undefined) {
            menu.packages =
                typeof body.packageTypes === "string"
                    ? JSON.parse(body.packageTypes)
                    : body.packageTypes;
        }

        if (body.groceries !== undefined) {
            const parsedGroceries =
                typeof body.groceries === "string"
                    ? JSON.parse(body.groceries)
                    : body.groceries;

            menu.groceries = normalizeGroceries(parsedGroceries) as any;
            menu.totalGroceryCost = calculateTotalGroceryCost(menu.groceries);
        }

        // Update sample picture only if a new one was uploaded
        if (req.file) {
            menu.samplePicture =
                (req.file as any).path ||
                (req.file as any).location ||
                (req.file as any).filename;
        }

        if (menu.menuCreatorType === "organization") {
            menu.chefId = undefined;
            menu.isSignatureMenu = false;
        }

        // Ensure chefId exists for chef menus
        if (menu.menuCreatorType === "chef" && !menu.chefId) {
            return res.status(400).json({
                success: false,
                message: "chefId is required for chef menus.",
            });
        }

        await menu.save();

        const updatedMenuTypeIds = menu.menuCategory.map((id) => id.toString());
        const addedMenuTypeIds = updatedMenuTypeIds.filter(
            (id) => !previousMenuTypeIds.includes(id)
        );
        const removedMenuTypeIds = previousMenuTypeIds.filter(
            (id) => !updatedMenuTypeIds.includes(id)
        );

        if (addedMenuTypeIds.length > 0) {
            await MenuTypes.updateMany(
                { _id: { $in: addedMenuTypeIds } },
                {
                    $addToSet: {
                        menus: menu._id,
                    },
                }
            );
        }

        if (removedMenuTypeIds.length > 0) {
            await MenuTypes.updateMany(
                { _id: { $in: removedMenuTypeIds } },
                {
                    $pull: {
                        menus: menu._id,
                    },
                }
            );
        }

        return res.status(200).json({
            success: true,
            data: menu,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const deleteMenu = async (req: Request, res: Response): Promise<any> => {
    try {
        const menu = await Menu.findByIdAndDelete(req.params.id);

        if (!menu)
            return res.status(404).json({
                success: false,
                message: "Menu not found",
            });

        if (menu.menuCategory.length > 0) {
            await MenuTypes.updateMany(
                {
                    _id: {
                        $in: menu.menuCategory,
                    },
                },
                {
                    $pull: {
                        menus: menu._id,
                    },
                }
            );
        }

        return res.json({
            success: true,
            message: "Menu deleted successfully",
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const addGrocery = async (
    req: Request,
    res: Response
): Promise<any> => {
    try {
        const menu = await Menu.findById(req.params.menuId);

        if (!menu) {
            return res.status(404).json({
                success: false,
                message: "Menu not found",
            });
        }

        const grocery = {
            groceryName: req.body.groceryName,
            description: req.body.description,
            unitPrice: Number(req.body.unitPrice),
        };

        if (!Array.isArray(menu.groceries)) {
            menu.groceries = [] as any;
        }

        menu.groceries.push(grocery as any);

        menu.totalGroceryCost = calculateTotalGroceryCost(menu.groceries);

        await menu.save();

        return res.status(201).json({
            success: true,
            data: menu,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const updateGrocery = async (
    req: Request,
    res: Response
): Promise<any> => {
    try {
        const menu = await Menu.findById(req.params.menuId);

        if (!menu) {
            return res.status(404).json({
                success: false,
                message: "Menu not found",
            });
        }

        if (!Array.isArray(menu.groceries)) {
            menu.groceries = [] as any;
        }

        const groceriesCollection = menu.groceries as any;
        const grocery =
            typeof groceriesCollection.id === "function"
                ? groceriesCollection.id(req.params.groceryId)
                : groceriesCollection.find(
                      (item: any) => item?._id?.toString() === req.params.groceryId
                  );

        if (!grocery) {
            return res.status(404).json({
                success: false,
                message: "Grocery not found",
            });
        }

        if (req.body.groceryName !== undefined) {
            grocery.groceryName = req.body.groceryName;
        }

        if (req.body.description !== undefined) {
            grocery.description = req.body.description;
        }

        if (req.body.unitPrice !== undefined) {
            grocery.unitPrice = Number(req.body.unitPrice);
        }

        menu.totalGroceryCost = calculateTotalGroceryCost(menu.groceries);

        await menu.save();

        return res.json({
            success: true,
            data: menu,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const deleteGrocery = async (
    req: Request,
    res: Response
): Promise<any> => {
    try {
        const menu = await Menu.findById(req.params.menuId);

        if (!menu) {
            return res.status(404).json({
                success: false,
                message: "Menu not found",
            });
        }

        if (!Array.isArray(menu.groceries)) {
            menu.groceries = [] as any;
        }

        const groceriesCollection = menu.groceries as any;
        const grocery =
            typeof groceriesCollection.id === "function"
                ? groceriesCollection.id(req.params.groceryId)
                : groceriesCollection.find(
                      (item: any) => item?._id?.toString() === req.params.groceryId
                  );

        if (!grocery) {
            return res.status(404).json({
                success: false,
                message: "Grocery not found",
            });
        }

        grocery.deleteOne();

        menu.totalGroceryCost = calculateTotalGroceryCost(menu.groceries);

        await menu.save();

        return res.json({
            success: true,
            message: "Grocery removed successfully",
            data: menu,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const addMenuToPackage = async (
    req: Request,
    res: Response
): Promise<any> => {
    try {
        const { menuId, packageId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(menuId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid menuId.",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(packageId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid packageId.",
            });
        }

        const menu = await Menu.findById(menuId);

        if (!menu) {
            return res.status(404).json({
                success: false,
                message: "Menu not found.",
            });
        }

        const alreadyExists = menu.packages.some(
            id => id.toString() === packageId
        );

        if (alreadyExists) {
            return res.status(409).json({
                success: false,
                message: "Menu is already assigned to this package.",
            });
        }

        menu.packages.push(new mongoose.Types.ObjectId(packageId));

        await menu.save();

        return res.status(200).json({
            success: true,
            message: "Menu added to package successfully.",
            data: menu,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const removeMenuFromPackage = async (
    req: Request,
    res: Response
): Promise<any> => {
    try {
        const { menuId, packageId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(menuId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid menuId.",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(packageId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid packageId.",
            });
        }

        const menu = await Menu.findById(menuId);

        if (!menu) {
            return res.status(404).json({
                success: false,
                message: "Menu not found.",
            });
        }

        const originalLength = menu.packages.length;

        menu.packages = menu.packages.filter(
            id => id.toString() !== packageId
        ) as any;

        if (menu.packages.length === originalLength) {
            return res.status(404).json({
                success: false,
                message: "Package is not assigned to this menu.",
            });
        }

        await menu.save();

        return res.status(200).json({
            success: true,
            message: "Menu removed from package successfully.",
            data: menu,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};