import { Response, NextFunction } from "express";
import { AdminRequest } from "./adminAuth";

export const superAdminOnly = async (
    req: AdminRequest,
    res: Response,
    next: NextFunction
): Promise<any> => {
    if (req.admin?.role !== "super_admin") {
        return res
            .status(403)
            .json({ message: "Super admin access only" });
    }
    next();
};