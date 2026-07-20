"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeMenuFromPackage = exports.addMenuToPackage = exports.deleteGrocery = exports.updateGrocery = exports.addGrocery = exports.deleteMenu = exports.updateMenu = exports.getMenu = exports.getMenus = exports.createMenu = void 0;
const Menu_1 = __importDefault(require("../models/Menu"));
const mongoose_1 = __importDefault(require("mongoose"));
const MenuTypes_1 = __importDefault(require("../models/MenuTypes"));
const ALLOWED_MENU_CLASSES = ["nigerian", "continental"];
const ALLOWED_PRICING_MODELS = ["perhead", "plater"];
const normalizeOptionalEnumInput = (value) => {
    if (value === undefined || value === null) {
        return undefined;
    }
    const normalizedValue = String(value).trim().toLowerCase();
    return normalizedValue === "" ? undefined : normalizedValue;
};
const normalizeMenuCategoryResponse = (value) => {
    if (Array.isArray(value)) {
        return value;
    }
    if (value == null) {
        return [];
    }
    return [value];
};
const parseMenuCategoryIds = (value) => {
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
            }
            catch (_a) {
                return { error: "menuCategory must be an array of MenuTypes IDs." };
            }
        }
        else {
            parsed = [trimmed];
        }
    }
    if (!Array.isArray(parsed)) {
        return { error: "menuCategory must be an array of MenuTypes IDs." };
    }
    const ids = parsed.map((item) => String(item).trim()).filter(Boolean);
    const invalidId = ids.find((id) => !mongoose_1.default.Types.ObjectId.isValid(id));
    if (invalidId) {
        return { error: `Invalid menuCategory id: ${invalidId}` };
    }
    return { ids: Array.from(new Set(ids)) };
};
const normalizeGroceries = (value) => {
    return Array.isArray(value) ? value : [];
};
const calculateTotalGroceryCost = (groceries) => {
    return normalizeGroceries(groceries).reduce((sum, grocery) => sum + Number((grocery === null || grocery === void 0 ? void 0 : grocery.unitPrice) || 0), 0);
};
const createMenu = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const body = (_a = req.body) !== null && _a !== void 0 ? _a : {};
        const { menuCreatorType, title, description, relatedServiceId, isSignatureMenu, menuType, menuClass, pricingModel, menuCategory, pricePerHead, chefId, } = body;
        const uploadedFile = req.file;
        const { ids: menuCategoryIds, error: menuCategoryError } = parseMenuCategoryIds(menuCategory);
        if (menuCategoryError) {
            return res.status(400).json({
                success: false,
                message: menuCategoryError,
            });
        }
        if (menuCategoryIds && menuCategoryIds.length > 0) {
            const menuTypesCount = yield MenuTypes_1.default.countDocuments({
                _id: { $in: menuCategoryIds },
            });
            if (menuTypesCount !== menuCategoryIds.length) {
                return res.status(404).json({
                    success: false,
                    message: "One or more menuCategory IDs do not exist.",
                });
            }
        }
        const samplePicture = (uploadedFile === null || uploadedFile === void 0 ? void 0 : uploadedFile.location) ||
            (uploadedFile === null || uploadedFile === void 0 ? void 0 : uploadedFile.path) ||
            (uploadedFile === null || uploadedFile === void 0 ? void 0 : uploadedFile.filename) ||
            undefined;
        const normalizedMenuClass = normalizeOptionalEnumInput(menuClass);
        const normalizedPricingModel = normalizeOptionalEnumInput(pricingModel);
        if (normalizedMenuClass !== undefined &&
            !ALLOWED_MENU_CLASSES.includes(normalizedMenuClass)) {
            return res.status(400).json({
                success: false,
                message: `menuClass must be one of: ${ALLOWED_MENU_CLASSES.join(", ")}.`,
            });
        }
        if (normalizedPricingModel !== undefined &&
            !ALLOWED_PRICING_MODELS.includes(normalizedPricingModel)) {
            return res.status(400).json({
                success: false,
                message: `pricingModel must be one of: ${ALLOWED_PRICING_MODELS.join(", ")}.`,
            });
        }
        // Normalize chefId
        const normalizedChefId = typeof chefId === "string" && chefId.trim() === ""
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
            if (!mongoose_1.default.Types.ObjectId.isValid(normalizedChefId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid chefId.",
                });
            }
        }
        const menuData = {
            menuCreatorType,
            title,
            description,
            relatedServiceId,
            samplePicture,
            menuType,
            menuCategory: (menuCategoryIds === null || menuCategoryIds === void 0 ? void 0 : menuCategoryIds.map((id) => new mongoose_1.default.Types.ObjectId(id))) || [],
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
        }
        else {
            // Organization menus don't use chefId
            menuData.isSignatureMenu = false;
        }
        const menu = yield Menu_1.default.create(menuData);
        if (menuCategoryIds && menuCategoryIds.length > 0) {
            yield MenuTypes_1.default.updateMany({ _id: { $in: menuCategoryIds } }, {
                $addToSet: {
                    menus: menu._id,
                },
            });
        }
        return res.status(201).json({
            success: true,
            message: "Menu created successfully.",
            data: menu,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.createMenu = createMenu;
const getMenus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { chefId, isSignatureMenu, hasGroceries, packageId, menuCreatorType, menuType, menuClass, pricingModel, menuCategory, search, sortBy = "createdAt", sortOrder = "desc", page = "1", limit = "10", } = req.query;
        const filter = {};
        const andConditions = [];
        // Chef
        if (chefId) {
            if (!mongoose_1.default.Types.ObjectId.isValid(chefId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid chefId.",
                });
            }
            filter.chefId = chefId;
        }
        // Package
        if (packageId) {
            if (!mongoose_1.default.Types.ObjectId.isValid(packageId)) {
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
            if (normalizedMenuClass !== undefined &&
                !ALLOWED_MENU_CLASSES.includes(normalizedMenuClass)) {
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
            if (normalizedPricingModel !== undefined &&
                !ALLOWED_PRICING_MODELS.includes(normalizedPricingModel)) {
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
            if (categoryIds.some((id) => !mongoose_1.default.Types.ObjectId.isValid(id))) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid menuCategory.",
                });
            }
            const categoryObjectIds = categoryIds.map((id) => new mongoose_1.default.Types.ObjectId(id));
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
        const sortField = allowedSortFields.includes(sortBy)
            ? sortBy
            : "createdAt";
        const sort = {
            [sortField]: sortOrder === "asc" ? 1 : -1,
        };
        const [menus, total] = yield Promise.all([
            Menu_1.default.find(filter)
                .populate("chefId")
                .populate("packages")
                .populate("menuCategory", "title description packageId")
                .sort(sort)
                .skip(skip)
                .limit(limitNumber),
            Menu_1.default.countDocuments(filter),
        ]);
        const data = menus.map((menu) => {
            const item = menu.toJSON();
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.getMenus = getMenus;
const getMenu = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const menu = yield Menu_1.default.findById(req.params.id)
            .populate("chefId")
            .populate("packages")
            .populate("menuCategory", "title description packageId pricingModel menuClass");
        if (!menu)
            return res.status(404).json({
                success: false,
                message: "Menu not found",
            });
        const data = menu.toJSON();
        data.menuCategory = normalizeMenuCategoryResponse(data.menuCategory);
        return res.json({
            success: true,
            data,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.getMenu = getMenu;
const updateMenu = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const menu = yield Menu_1.default.findById(req.params.id);
        if (!menu) {
            return res.status(404).json({
                success: false,
                message: "Menu not found",
            });
        }
        const body = (_a = req.body) !== null && _a !== void 0 ? _a : {};
        const { menuCreatorType, title, description, isSignatureMenu, menuType, menuClass, pricingModel, menuCategory, pricePerHead, chefId, } = body;
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
            if (normalizedMenuClass !== undefined &&
                !ALLOWED_MENU_CLASSES.includes(normalizedMenuClass)) {
                return res.status(400).json({
                    success: false,
                    message: `menuClass must be one of: ${ALLOWED_MENU_CLASSES.join(", ")}.`,
                });
            }
            menu.menuClass = normalizedMenuClass;
        }
        if (pricingModel !== undefined) {
            const normalizedPricingModel = normalizeOptionalEnumInput(pricingModel);
            if (normalizedPricingModel !== undefined &&
                !ALLOWED_PRICING_MODELS.includes(normalizedPricingModel)) {
                return res.status(400).json({
                    success: false,
                    message: `pricingModel must be one of: ${ALLOWED_PRICING_MODELS.join(", ")}.`,
                });
            }
            menu.pricingModel = normalizedPricingModel;
        }
        if (menuCategory !== undefined) {
            const { ids: menuCategoryIds, error: menuCategoryError } = parseMenuCategoryIds(menuCategory);
            if (menuCategoryError) {
                return res.status(400).json({
                    success: false,
                    message: menuCategoryError,
                });
            }
            if (menuCategoryIds && menuCategoryIds.length > 0) {
                const menuTypesCount = yield MenuTypes_1.default.countDocuments({
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
                (menuCategoryIds === null || menuCategoryIds === void 0 ? void 0 : menuCategoryIds.map((id) => new mongoose_1.default.Types.ObjectId(id))) || [];
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
            const parsedGroceries = typeof body.groceries === "string"
                ? JSON.parse(body.groceries)
                : body.groceries;
            menu.groceries = normalizeGroceries(parsedGroceries);
            menu.totalGroceryCost = calculateTotalGroceryCost(menu.groceries);
        }
        // Update sample picture only if a new one was uploaded
        if (req.file) {
            menu.samplePicture =
                req.file.path ||
                    req.file.location ||
                    req.file.filename;
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
        yield menu.save();
        const updatedMenuTypeIds = menu.menuCategory.map((id) => id.toString());
        const addedMenuTypeIds = updatedMenuTypeIds.filter((id) => !previousMenuTypeIds.includes(id));
        const removedMenuTypeIds = previousMenuTypeIds.filter((id) => !updatedMenuTypeIds.includes(id));
        if (addedMenuTypeIds.length > 0) {
            yield MenuTypes_1.default.updateMany({ _id: { $in: addedMenuTypeIds } }, {
                $addToSet: {
                    menus: menu._id,
                },
            });
        }
        if (removedMenuTypeIds.length > 0) {
            yield MenuTypes_1.default.updateMany({ _id: { $in: removedMenuTypeIds } }, {
                $pull: {
                    menus: menu._id,
                },
            });
        }
        return res.status(200).json({
            success: true,
            data: menu,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.updateMenu = updateMenu;
const deleteMenu = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const menu = yield Menu_1.default.findByIdAndDelete(req.params.id);
        if (!menu)
            return res.status(404).json({
                success: false,
                message: "Menu not found",
            });
        if (menu.menuCategory.length > 0) {
            yield MenuTypes_1.default.updateMany({
                _id: {
                    $in: menu.menuCategory,
                },
            }, {
                $pull: {
                    menus: menu._id,
                },
            });
        }
        return res.json({
            success: true,
            message: "Menu deleted successfully",
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.deleteMenu = deleteMenu;
const addGrocery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const menu = yield Menu_1.default.findById(req.params.menuId);
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
            menu.groceries = [];
        }
        menu.groceries.push(grocery);
        menu.totalGroceryCost = calculateTotalGroceryCost(menu.groceries);
        yield menu.save();
        return res.status(201).json({
            success: true,
            data: menu,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.addGrocery = addGrocery;
const updateGrocery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const menu = yield Menu_1.default.findById(req.params.menuId);
        if (!menu) {
            return res.status(404).json({
                success: false,
                message: "Menu not found",
            });
        }
        if (!Array.isArray(menu.groceries)) {
            menu.groceries = [];
        }
        const groceriesCollection = menu.groceries;
        const grocery = typeof groceriesCollection.id === "function"
            ? groceriesCollection.id(req.params.groceryId)
            : groceriesCollection.find((item) => { var _a; return ((_a = item === null || item === void 0 ? void 0 : item._id) === null || _a === void 0 ? void 0 : _a.toString()) === req.params.groceryId; });
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
        yield menu.save();
        return res.json({
            success: true,
            data: menu,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.updateGrocery = updateGrocery;
const deleteGrocery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const menu = yield Menu_1.default.findById(req.params.menuId);
        if (!menu) {
            return res.status(404).json({
                success: false,
                message: "Menu not found",
            });
        }
        if (!Array.isArray(menu.groceries)) {
            menu.groceries = [];
        }
        const groceriesCollection = menu.groceries;
        const grocery = typeof groceriesCollection.id === "function"
            ? groceriesCollection.id(req.params.groceryId)
            : groceriesCollection.find((item) => { var _a; return ((_a = item === null || item === void 0 ? void 0 : item._id) === null || _a === void 0 ? void 0 : _a.toString()) === req.params.groceryId; });
        if (!grocery) {
            return res.status(404).json({
                success: false,
                message: "Grocery not found",
            });
        }
        grocery.deleteOne();
        menu.totalGroceryCost = calculateTotalGroceryCost(menu.groceries);
        yield menu.save();
        return res.json({
            success: true,
            message: "Grocery removed successfully",
            data: menu,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.deleteGrocery = deleteGrocery;
const addMenuToPackage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { menuId, packageId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(menuId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid menuId.",
            });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(packageId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid packageId.",
            });
        }
        const menu = yield Menu_1.default.findById(menuId);
        if (!menu) {
            return res.status(404).json({
                success: false,
                message: "Menu not found.",
            });
        }
        const alreadyExists = menu.packages.some(id => id.toString() === packageId);
        if (alreadyExists) {
            return res.status(409).json({
                success: false,
                message: "Menu is already assigned to this package.",
            });
        }
        menu.packages.push(new mongoose_1.default.Types.ObjectId(packageId));
        yield menu.save();
        return res.status(200).json({
            success: true,
            message: "Menu added to package successfully.",
            data: menu,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.addMenuToPackage = addMenuToPackage;
const removeMenuFromPackage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { menuId, packageId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(menuId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid menuId.",
            });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(packageId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid packageId.",
            });
        }
        const menu = yield Menu_1.default.findById(menuId);
        if (!menu) {
            return res.status(404).json({
                success: false,
                message: "Menu not found.",
            });
        }
        const originalLength = menu.packages.length;
        menu.packages = menu.packages.filter(id => id.toString() !== packageId);
        if (menu.packages.length === originalLength) {
            return res.status(404).json({
                success: false,
                message: "Package is not assigned to this menu.",
            });
        }
        yield menu.save();
        return res.status(200).json({
            success: true,
            message: "Menu removed from package successfully.",
            data: menu,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.removeMenuFromPackage = removeMenuFromPackage;
