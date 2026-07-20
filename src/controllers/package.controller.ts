import { Request, Response } from "express";
import Menu from "../models/Menu";
import Package from "../models/Package";
import mongoose from "mongoose";


export const createPackage = async (req: Request, res: Response): Promise<any> => {
    console.log('API sent to create package', req.body, req.file);
    const pkgPic = req.file as any; // multer file
    const {
        title,
        description,
    } = req.body;

    const packageImage = req.file
        ? (req.file as any).path
        : undefined;

    const pkg = await Package.create({
        title,
        description,
        packageImage: pkgPic?.location || pkgPic?.path || "", // depending on S3 or local
    });

    return res.status(201).json({
        success: true,
        data: pkg,
    });
};

export const getPackages = async (
    req: Request,
    res: Response
): Promise<any> => {

    const packages = await Package.find()
        .populate("menus");

    return res.json({
        success: true,
        data: packages,
    });

};

export const getPackage = async (
    req: Request,
    res: Response
): Promise<any> => {

    const pkg = await Package.findById(req.params.id)
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

};

export const updatePackage = async (
    req: Request,
    res: Response
): Promise<any> => {
    try {
        const { title, description } = req.body;
        const pkg = await Package.findById(req.params.id);

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
                (req.file as any).path ||
                (req.file as any).location ||
                (req.file as any).filename;
        }

        await pkg.save();

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