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
const createPackage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('API sent to create package', req.body, req.file);
    const pkgPic = req.file; // multer file
    const { title, description, } = req.body;
    const packageImage = req.file
        ? req.file.path
        : undefined;
    const pkg = yield Package_1.default.create({
        title,
        description,
        packageImage: (pkgPic === null || pkgPic === void 0 ? void 0 : pkgPic.location) || (pkgPic === null || pkgPic === void 0 ? void 0 : pkgPic.path) || "", // depending on S3 or local
    });
    return res.status(201).json({
        success: true,
        data: pkg,
    });
});
exports.createPackage = createPackage;
const getPackages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const packages = yield Package_1.default.find()
        .populate("menus");
    return res.json({
        success: true,
        data: packages,
    });
});
exports.getPackages = getPackages;
const getPackage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pkg = yield Package_1.default.findById(req.params.id)
        .populate("menus");
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
});
exports.getPackage = getPackage;
const updatePackage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description } = req.body;
        const pkg = yield Package_1.default.findById(req.params.id);
        if (!pkg) {
            return res.status(404).json({
                success: false,
                message: "Package not found.",
            });
        }
        if (title != null && title.trim() !== "") {
            pkg.title = title;
        }
        if (description != null && description.trim() !== "") {
            pkg.description = description;
        }
        // Replace image only if a new one was uploaded
        if (req.file) {
            pkg.packageImage =
                req.file.path ||
                    req.file.location ||
                    req.file.filename;
        }
        yield pkg.save();
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
