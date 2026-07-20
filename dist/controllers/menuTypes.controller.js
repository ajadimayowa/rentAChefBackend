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
exports.updateMenuOnMenuType = exports.removeMenuFromMenuType = exports.addMenuToMenuType = exports.deleteMenuType = exports.updateMenuType = exports.getMenuType = exports.getMenuTypes = exports.createMenuType = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const MenuTypes_1 = __importDefault(require("../models/MenuTypes"));
const Menu_1 = __importDefault(require("../models/Menu"));
const Package_1 = __importDefault(require("../models/Package"));
const isValidObjectId = (id) => mongoose_1.default.Types.ObjectId.isValid(id);
const normalizeMenuCategoryArray = (menuIds) => __awaiter(void 0, void 0, void 0, function* () {
    if (menuIds.length === 0) {
        return;
    }
    const menus = yield Menu_1.default.find({
        _id: {
            $in: menuIds,
        },
    }).select("menuCategory");
    for (const menu of menus) {
        const currentValue = menu.menuCategory;
        if (Array.isArray(currentValue)) {
            continue;
        }
        if (currentValue instanceof mongoose_1.default.Types.ObjectId) {
            menu.menuCategory = [currentValue];
        }
        else if (currentValue &&
            typeof currentValue === "string" &&
            mongoose_1.default.Types.ObjectId.isValid(currentValue)) {
            menu.menuCategory = [
                new mongoose_1.default.Types.ObjectId(currentValue),
            ];
        }
        else {
            menu.menuCategory = [];
        }
        yield menu.save();
    }
});
const createMenuType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const packageExists = yield Package_1.default.exists({ _id: packageId });
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
        const invalidMenuId = menus.find((menuId) => !isValidObjectId(menuId));
        if (invalidMenuId) {
            return res.status(400).json({
                success: false,
                message: `Invalid menu id: ${invalidMenuId}`,
            });
        }
        if (menus.length > 0) {
            const menuCount = yield Menu_1.default.countDocuments({ _id: { $in: menus } });
            if (menuCount !== menus.length) {
                return res.status(404).json({
                    success: false,
                    message: "One or more menu IDs do not exist",
                });
            }
        }
        const menuTypes = yield MenuTypes_1.default.create({
            title: normalizedTitle,
            description: normalizedDescription,
            packageId,
            menus,
        });
        if (menus.length > 0) {
            yield normalizeMenuCategoryArray(menus);
            yield Menu_1.default.updateMany({
                _id: {
                    $in: menus,
                },
            }, {
                $addToSet: {
                    menuCategory: menuTypes._id,
                },
            });
        }
        const data = yield MenuTypes_1.default.findById(menuTypes._id)
            .populate("packageId")
            .populate("menus");
        return res.status(201).json({
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
exports.createMenuType = createMenuType;
const getMenuTypes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { packageId, search, sortBy = "createdAt", sortOrder = "desc", page = "1", limit = "10", } = req.query;
        const filter = {};
        if (packageId) {
            if (!isValidObjectId(packageId)) {
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
        const sortField = allowedSortFields.includes(sortBy)
            ? sortBy
            : "createdAt";
        const sort = {
            [sortField]: sortOrder === "asc" ? 1 : -1,
        };
        const [data, total] = yield Promise.all([
            MenuTypes_1.default.find(filter)
                .populate("packageId")
                .populate("menus")
                .sort(sort)
                .skip(skip)
                .limit(limitNumber),
            MenuTypes_1.default.countDocuments(filter),
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.getMenuTypes = getMenuTypes;
const getMenuType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid MenuTypes ID",
            });
        }
        const data = yield MenuTypes_1.default.findById(id)
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.getMenuType = getMenuType;
const updateMenuType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { title, description, packageId, menus } = req.body;
        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid MenuTypes ID",
            });
        }
        const menuType = yield MenuTypes_1.default.findById(id);
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
            const packageExists = yield Package_1.default.exists({ _id: packageId });
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
            const invalidMenuId = menus.find((menuId) => !isValidObjectId(menuId));
            if (invalidMenuId) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid menu id: ${invalidMenuId}`,
                });
            }
            if (menus.length > 0) {
                const menuCount = yield Menu_1.default.countDocuments({ _id: { $in: menus } });
                if (menuCount !== menus.length) {
                    return res.status(404).json({
                        success: false,
                        message: "One or more menu IDs do not exist",
                    });
                }
            }
            menuType.menus = menus;
        }
        yield menuType.save();
        const updatedMenuIds = menuType.menus.map((menuId) => menuId.toString());
        const addedMenuIds = updatedMenuIds.filter((menuId) => !previousMenuIds.includes(menuId));
        const removedMenuIds = previousMenuIds.filter((menuId) => !updatedMenuIds.includes(menuId));
        if (addedMenuIds.length > 0) {
            yield normalizeMenuCategoryArray(addedMenuIds);
            yield Menu_1.default.updateMany({
                _id: {
                    $in: addedMenuIds,
                },
            }, {
                $addToSet: {
                    menuCategory: menuType._id,
                },
            });
        }
        if (removedMenuIds.length > 0) {
            yield normalizeMenuCategoryArray(removedMenuIds);
            yield Menu_1.default.updateMany({
                _id: {
                    $in: removedMenuIds,
                },
            }, {
                $pull: {
                    menuCategory: menuType._id,
                },
            });
        }
        const data = yield MenuTypes_1.default.findById(id)
            .populate("packageId")
            .populate("menus");
        return res.status(200).json({
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
exports.updateMenuType = updateMenuType;
const deleteMenuType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid MenuTypes ID",
            });
        }
        const data = yield MenuTypes_1.default.findByIdAndDelete(id);
        if (!data) {
            return res.status(404).json({
                success: false,
                message: "MenuTypes not found",
            });
        }
        if (data.menus.length > 0) {
            yield normalizeMenuCategoryArray(data.menus.map((menuId) => menuId.toString()));
            yield Menu_1.default.updateMany({
                _id: {
                    $in: data.menus,
                },
            }, {
                $pull: {
                    menuCategory: data._id,
                },
            });
        }
        return res.status(200).json({
            success: true,
            message: "MenuTypes deleted successfully",
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.deleteMenuType = deleteMenuType;
const addMenuToMenuType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, menuId } = req.params;
        if (!isValidObjectId(id) || !isValidObjectId(menuId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ID supplied",
            });
        }
        const menuType = yield MenuTypes_1.default.findById(id);
        if (!menuType) {
            return res.status(404).json({
                success: false,
                message: "MenuTypes not found",
            });
        }
        const menuExists = yield Menu_1.default.exists({ _id: menuId });
        if (!menuExists) {
            return res.status(404).json({
                success: false,
                message: "Menu not found",
            });
        }
        if (!menuType.menus.some((menu) => menu.toString() === menuId)) {
            menuType.menus.push(new mongoose_1.default.Types.ObjectId(menuId));
            yield menuType.save();
            yield normalizeMenuCategoryArray([menuId]);
            yield Menu_1.default.updateOne({
                _id: menuId,
            }, {
                $addToSet: {
                    menuCategory: menuType._id,
                },
            });
        }
        const data = yield MenuTypes_1.default.findById(id)
            .populate("packageId")
            .populate("menus");
        return res.status(200).json({
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
exports.addMenuToMenuType = addMenuToMenuType;
const removeMenuFromMenuType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, menuId } = req.params;
        if (!isValidObjectId(id) || !isValidObjectId(menuId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ID supplied",
            });
        }
        const menuType = yield MenuTypes_1.default.findById(id);
        if (!menuType) {
            return res.status(404).json({
                success: false,
                message: "MenuTypes not found",
            });
        }
        menuType.menus = menuType.menus.filter((menu) => menu.toString() !== menuId);
        yield menuType.save();
        yield normalizeMenuCategoryArray([menuId]);
        yield Menu_1.default.updateOne({
            _id: menuId,
        }, {
            $pull: {
                menuCategory: menuType._id,
            },
        });
        const data = yield MenuTypes_1.default.findById(id)
            .populate("packageId")
            .populate("menus");
        return res.status(200).json({
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
exports.removeMenuFromMenuType = removeMenuFromMenuType;
const updateMenuOnMenuType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, menuId } = req.params;
        const { newMenuId } = req.body;
        if (!isValidObjectId(id) || !isValidObjectId(menuId) || !isValidObjectId(newMenuId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ID supplied",
            });
        }
        const menuType = yield MenuTypes_1.default.findById(id);
        if (!menuType) {
            return res.status(404).json({
                success: false,
                message: "MenuTypes not found",
            });
        }
        const newMenuExists = yield Menu_1.default.exists({ _id: newMenuId });
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
        menuType.menus[index] = new mongoose_1.default.Types.ObjectId(newMenuId);
        yield menuType.save();
        yield normalizeMenuCategoryArray([menuId, newMenuId]);
        yield Menu_1.default.updateOne({
            _id: menuId,
        }, {
            $pull: {
                menuCategory: menuType._id,
            },
        });
        yield Menu_1.default.updateOne({
            _id: newMenuId,
        }, {
            $addToSet: {
                menuCategory: menuType._id,
            },
        });
        const data = yield MenuTypes_1.default.findById(id)
            .populate("packageId")
            .populate("menus");
        return res.status(200).json({
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
exports.updateMenuOnMenuType = updateMenuOnMenuType;
