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
exports.removeMenuFromPackage = exports.addMenuToPackage = exports.deletePackage = exports.updatePackage = exports.getPackage = exports.getPackages = exports.createPackage = void 0;
const Menu_1 = __importDefault(require("../models/Menu"));
const Package_1 = __importDefault(require("../models/Package"));
const Service_1 = require("../models/Service");
const mongoose_1 = __importDefault(require("mongoose"));
/** Accepts a bare string, a JSON-array string, or an already-parsed array — the three shapes a multipart/form-data field can arrive in. */
const parseArrayField = (value) => {
    if (value === undefined || value === null)
        return [];
    if (Array.isArray(value)) {
        return value.map((v) => String(v).trim()).filter(Boolean);
    }
    const trimmed = String(value).trim();
    if (trimmed === "")
        return [];
    if (trimmed.startsWith("[")) {
        try {
            const parsed = JSON.parse(trimmed);
            return Array.isArray(parsed) ? parsed.map((v) => String(v).trim()).filter(Boolean) : [trimmed];
        }
        catch (_a) {
            return [trimmed];
        }
    }
    return [trimmed];
};
const parseObjectIdArrayField = (value) => {
    const ids = parseArrayField(value);
    const invalid = ids.find((id) => !mongoose_1.default.Types.ObjectId.isValid(id));
    if (invalid)
        return { error: `Invalid id: ${invalid}` };
    return { ids: Array.from(new Set(ids)) };
};
const createPackage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, price, durationHours, guests, isActive } = req.body;
        if (!title || !String(title).trim()) {
            return res.status(400).json({ success: false, message: "title is required" });
        }
        if (!description || !String(description).trim()) {
            return res.status(400).json({ success: false, message: "description is required" });
        }
        const priceNum = Number(price);
        const durationNum = Number(durationHours);
        const guestsNum = Number(guests);
        if (!Number.isFinite(priceNum) || priceNum < 0) {
            return res.status(400).json({ success: false, message: "A valid price is required" });
        }
        if (!Number.isFinite(durationNum) || durationNum < 0) {
            return res.status(400).json({ success: false, message: "A valid durationHours is required" });
        }
        if (!Number.isFinite(guestsNum) || guestsNum < 1) {
            return res.status(400).json({ success: false, message: "A valid guests count is required" });
        }
        const { ids: serviceIds, error: serviceError } = parseObjectIdArrayField(req.body.serviceIds);
        if (serviceError)
            return res.status(400).json({ success: false, message: serviceError });
        if (serviceIds && serviceIds.length > 0) {
            const serviceCount = yield Service_1.ServiceModel.countDocuments({ _id: { $in: serviceIds } });
            if (serviceCount !== serviceIds.length) {
                return res.status(404).json({ success: false, message: "One or more serviceIds do not exist." });
            }
        }
        const { ids: menuIds, error: menuError } = parseObjectIdArrayField(req.body.menus);
        if (menuError)
            return res.status(400).json({ success: false, message: menuError });
        if (menuIds && menuIds.length > 0) {
            const menuCount = yield Menu_1.default.countDocuments({ _id: { $in: menuIds } });
            if (menuCount !== menuIds.length) {
                return res.status(404).json({ success: false, message: "One or more menu ids do not exist." });
            }
        }
        const perks = parseArrayField(req.body.perks);
        const pkgPic = req.file;
        const packageImage = (pkgPic === null || pkgPic === void 0 ? void 0 : pkgPic.location) || (pkgPic === null || pkgPic === void 0 ? void 0 : pkgPic.path) || undefined;
        const pkg = yield Package_1.default.create({
            title,
            description,
            price: priceNum,
            durationHours: durationNum,
            guests: guestsNum,
            serviceIds: serviceIds || [],
            menus: menuIds || [],
            perks,
            isActive: isActive === undefined ? true : isActive === true || isActive === "true",
            packageImage,
        });
        if (menuIds && menuIds.length > 0) {
            yield Menu_1.default.updateMany({ _id: { $in: menuIds } }, { $addToSet: { packages: pkg._id } });
        }
        return res.status(201).json({
            success: true,
            data: pkg,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.createPackage = createPackage;
const getPackages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const packages = yield Package_1.default.find()
            .populate("menus")
            .populate("serviceIds", "name")
            .sort({ createdAt: -1 });
        return res.json({
            success: true,
            data: packages,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.getPackages = getPackages;
const getPackage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pkg = yield Package_1.default.findById(req.params.id)
            .populate("menus")
            .populate("serviceIds", "name");
        if (!pkg) {
            return res.status(404).json({
                success: false,
                message: "Package not found",
            });
        }
        return res.json({
            success: true,
            data: pkg,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.getPackage = getPackage;
const updatePackage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, price, durationHours, guests, isActive } = req.body;
        const pkg = yield Package_1.default.findById(req.params.id);
        if (!pkg) {
            return res.status(404).json({
                success: false,
                message: "Package not found.",
            });
        }
        if (title != null && String(title).trim() !== "") {
            pkg.title = title;
        }
        if (description != null && String(description).trim() !== "") {
            pkg.description = description;
        }
        if (price !== undefined) {
            const priceNum = Number(price);
            if (!Number.isFinite(priceNum) || priceNum < 0) {
                return res.status(400).json({ success: false, message: "A valid price is required" });
            }
            pkg.price = priceNum;
        }
        if (durationHours !== undefined) {
            const durationNum = Number(durationHours);
            if (!Number.isFinite(durationNum) || durationNum < 0) {
                return res.status(400).json({ success: false, message: "A valid durationHours is required" });
            }
            pkg.durationHours = durationNum;
        }
        if (guests !== undefined) {
            const guestsNum = Number(guests);
            if (!Number.isFinite(guestsNum) || guestsNum < 1) {
                return res.status(400).json({ success: false, message: "A valid guests count is required" });
            }
            pkg.guests = guestsNum;
        }
        if (isActive !== undefined) {
            pkg.isActive = isActive === true || isActive === "true";
        }
        if (req.body.perks !== undefined) {
            pkg.perks = parseArrayField(req.body.perks);
        }
        if (req.body.serviceIds !== undefined) {
            const { ids: serviceIds, error: serviceError } = parseObjectIdArrayField(req.body.serviceIds);
            if (serviceError)
                return res.status(400).json({ success: false, message: serviceError });
            if (serviceIds && serviceIds.length > 0) {
                const serviceCount = yield Service_1.ServiceModel.countDocuments({ _id: { $in: serviceIds } });
                if (serviceCount !== serviceIds.length) {
                    return res.status(404).json({ success: false, message: "One or more serviceIds do not exist." });
                }
            }
            pkg.serviceIds = (serviceIds || []).map((id) => new mongoose_1.default.Types.ObjectId(id));
        }
        let previousMenuIds = [];
        let updatedMenuIds = null;
        if (req.body.menus !== undefined) {
            const { ids: menuIds, error: menuError } = parseObjectIdArrayField(req.body.menus);
            if (menuError)
                return res.status(400).json({ success: false, message: menuError });
            if (menuIds && menuIds.length > 0) {
                const menuCount = yield Menu_1.default.countDocuments({ _id: { $in: menuIds } });
                if (menuCount !== menuIds.length) {
                    return res.status(404).json({ success: false, message: "One or more menu ids do not exist." });
                }
            }
            previousMenuIds = pkg.menus.map((id) => id.toString());
            updatedMenuIds = menuIds || [];
            pkg.menus = updatedMenuIds.map((id) => new mongoose_1.default.Types.ObjectId(id));
        }
        // Replace image only if a new one was uploaded
        if (req.file) {
            pkg.packageImage =
                req.file.path ||
                    req.file.location ||
                    req.file.filename;
        }
        yield pkg.save();
        if (updatedMenuIds) {
            const addedMenuIds = updatedMenuIds.filter((id) => !previousMenuIds.includes(id));
            const removedMenuIds = previousMenuIds.filter((id) => !updatedMenuIds.includes(id));
            if (addedMenuIds.length > 0) {
                yield Menu_1.default.updateMany({ _id: { $in: addedMenuIds } }, { $addToSet: { packages: pkg._id } });
            }
            if (removedMenuIds.length > 0) {
                yield Menu_1.default.updateMany({ _id: { $in: removedMenuIds } }, { $pull: { packages: pkg._id } });
            }
        }
        return res.status(200).json({
            success: true,
            message: "Package updated successfully.",
            data: pkg,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.updatePackage = updatePackage;
const deletePackage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pkg = yield Package_1.default.findByIdAndDelete(req.params.id);
    if (!pkg) {
        return res.status(404).json({
            success: false,
            message: "Package not found",
        });
    }
    yield Menu_1.default.updateMany({
        packages: pkg._id,
    }, {
        $pull: {
            packages: pkg._id,
        },
    });
    return res.json({
        success: true,
    });
});
exports.deletePackage = deletePackage;
const addMenuToPackage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { packageId, menuId } = req.params;
    const pkg = yield Package_1.default.findById(packageId);
    if (!pkg)
        return res.status(404).json({
            success: false,
            message: "Package not found",
        });
    const menu = yield Menu_1.default.findById(menuId);
    if (!menu)
        return res.status(404).json({
            success: false,
            message: "Menu not found",
        });
    if (!pkg.menus.some(id => id.toString() === menuId)) {
        pkg.menus.push(menu.id);
    }
    if (!menu.packages.some(id => id.toString() === packageId)) {
        menu.packages.push(pkg.id);
    }
    yield pkg.save();
    yield menu.save();
    return res.json({
        success: true,
        data: pkg,
    });
});
exports.addMenuToPackage = addMenuToPackage;
const removeMenuFromPackage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { packageId, menuId } = req.params;
    const pkg = yield Package_1.default.findById(packageId);
    const menu = yield Menu_1.default.findById(menuId);
    if (!pkg || !menu)
        return res.status(404).json({
            success: false,
        });
    pkg.menus = pkg.menus.filter(id => id.toString() !== menuId);
    menu.packages = menu.packages.filter(id => id.toString() !== packageId);
    yield pkg.save();
    yield menu.save();
    return res.json({
        success: true,
    });
});
exports.removeMenuFromPackage = removeMenuFromPackage;
