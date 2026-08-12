import { Request, Response } from "express";
import Menu from "../models/Menu";
import Package from "../models/Package";
import { ServiceModel as Service } from "../models/Service";
import mongoose from "mongoose";

/** Accepts a bare string, a JSON-array string, or an already-parsed array — the three shapes a multipart/form-data field can arrive in. */
const parseArrayField = (value: unknown): string[] => {
    if (value === undefined || value === null) return [];

    if (Array.isArray(value)) {
        return value.map((v) => String(v).trim()).filter(Boolean);
    }

    const trimmed = String(value).trim();
    if (trimmed === "") return [];

    if (trimmed.startsWith("[")) {
        try {
            const parsed = JSON.parse(trimmed);
            return Array.isArray(parsed) ? parsed.map((v) => String(v).trim()).filter(Boolean) : [trimmed];
        } catch {
            return [trimmed];
        }
    }

    return [trimmed];
};

const parseObjectIdArrayField = (
    value: unknown
): { ids?: string[]; error?: string } => {
    const ids = parseArrayField(value);
    const invalid = ids.find((id) => !mongoose.Types.ObjectId.isValid(id));
    if (invalid) return { error: `Invalid id: ${invalid}` };
    return { ids: Array.from(new Set(ids)) };
};

export const createPackage = async (req: Request, res: Response): Promise<any> => {
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
        if (serviceError) return res.status(400).json({ success: false, message: serviceError });

        if (serviceIds && serviceIds.length > 0) {
            const serviceCount = await Service.countDocuments({ _id: { $in: serviceIds } });
            if (serviceCount !== serviceIds.length) {
                return res.status(404).json({ success: false, message: "One or more serviceIds do not exist." });
            }
        }

        const { ids: menuIds, error: menuError } = parseObjectIdArrayField(req.body.menus);
        if (menuError) return res.status(400).json({ success: false, message: menuError });

        if (menuIds && menuIds.length > 0) {
            const menuCount = await Menu.countDocuments({ _id: { $in: menuIds } });
            if (menuCount !== menuIds.length) {
                return res.status(404).json({ success: false, message: "One or more menu ids do not exist." });
            }
        }

        const perks = parseArrayField(req.body.perks);

        const pkgPic = req.file as any;
        const packageImage = pkgPic?.location || pkgPic?.path || undefined;

        const pkg = await Package.create({
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
            await Menu.updateMany({ _id: { $in: menuIds } }, { $addToSet: { packages: pkg._id } });
        }

        return res.status(201).json({
            success: true,
            data: pkg,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getPackages = async (
    req: Request,
    res: Response
): Promise<any> => {
    try {
        const packages = await Package.find()
            .populate("menus")
            .populate("serviceIds", "name")
            .sort({ createdAt: -1 });

        return res.json({
            success: true,
            data: packages,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getPackage = async (
    req: Request,
    res: Response
): Promise<any> => {
    try {
        const pkg = await Package.findById(req.params.id)
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
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const updatePackage = async (
    req: Request,
    res: Response
): Promise<any> => {
    try {
        const { title, description, price, durationHours, guests, isActive } = req.body;
        const pkg = await Package.findById(req.params.id);

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
            if (serviceError) return res.status(400).json({ success: false, message: serviceError });

            if (serviceIds && serviceIds.length > 0) {
                const serviceCount = await Service.countDocuments({ _id: { $in: serviceIds } });
                if (serviceCount !== serviceIds.length) {
                    return res.status(404).json({ success: false, message: "One or more serviceIds do not exist." });
                }
            }

            pkg.serviceIds = (serviceIds || []).map((id) => new mongoose.Types.ObjectId(id)) as any;
        }

        let previousMenuIds: string[] = [];
        let updatedMenuIds: string[] | null = null;

        if (req.body.menus !== undefined) {
            const { ids: menuIds, error: menuError } = parseObjectIdArrayField(req.body.menus);
            if (menuError) return res.status(400).json({ success: false, message: menuError });

            if (menuIds && menuIds.length > 0) {
                const menuCount = await Menu.countDocuments({ _id: { $in: menuIds } });
                if (menuCount !== menuIds.length) {
                    return res.status(404).json({ success: false, message: "One or more menu ids do not exist." });
                }
            }

            previousMenuIds = pkg.menus.map((id) => id.toString());
            updatedMenuIds = menuIds || [];
            pkg.menus = updatedMenuIds.map((id) => new mongoose.Types.ObjectId(id)) as any;
        }

        // Replace image only if a new one was uploaded
        if (req.file) {
            pkg.packageImage =
                (req.file as any).path ||
                (req.file as any).location ||
                (req.file as any).filename;
        }

        await pkg.save();

        if (updatedMenuIds) {
            const addedMenuIds = updatedMenuIds.filter((id) => !previousMenuIds.includes(id));
            const removedMenuIds = previousMenuIds.filter((id) => !updatedMenuIds!.includes(id));

            if (addedMenuIds.length > 0) {
                await Menu.updateMany({ _id: { $in: addedMenuIds } }, { $addToSet: { packages: pkg._id } });
            }
            if (removedMenuIds.length > 0) {
                await Menu.updateMany({ _id: { $in: removedMenuIds } }, { $pull: { packages: pkg._id } });
            }
        }

        return res.status(200).json({
            success: true,
            message: "Package updated successfully.",
            data: pkg,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const deletePackage = async (
    req: Request,
    res: Response
): Promise<any> => {

    const pkg = await Package.findByIdAndDelete(req.params.id);

    if (!pkg) {
        return res.status(404).json({
            success: false,
            message: "Package not found",
        });
    }

    await Menu.updateMany(
        {
            packages: pkg._id,
        },
        {
            $pull: {
                packages: pkg._id,
            },
        }
    );

    return res.json({
        success: true,
    });

};

export const addMenuToPackage = async (
    req: Request,
    res: Response
): Promise<any> => {

    const { packageId, menuId } = req.params;

    const pkg = await Package.findById(packageId);

    if (!pkg)
        return res.status(404).json({
            success: false,
            message: "Package not found",
        });

    const menu = await Menu.findById(menuId);

    if (!menu)
        return res.status(404).json({
            success: false,
            message: "Menu not found",
        });

    if (
        !pkg.menus.some(
            id => id.toString() === menuId
        )
    ) {
        pkg.menus.push(menu.id);
    }

    if (
        !menu.packages.some(
            id => id.toString() === packageId
        )
    ) {
        menu.packages.push(pkg.id);
    }

    await pkg.save();
    await menu.save();

    return res.json({
        success: true,
        data: pkg,
    });

};

export const removeMenuFromPackage = async (
    req: Request,
    res: Response
): Promise<any> => {

    const { packageId, menuId } = req.params;

    const pkg = await Package.findById(packageId);

    const menu = await Menu.findById(menuId);

    if (!pkg || !menu)
        return res.status(404).json({
            success: false,
        });

    pkg.menus = pkg.menus.filter(
        id => id.toString() !== menuId
    ) as any;

    menu.packages = menu.packages.filter(
        id => id.toString() !== packageId
    ) as any;

    await pkg.save();
    await menu.save();

    return res.json({
        success: true,
    });

};