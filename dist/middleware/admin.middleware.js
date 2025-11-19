"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOnly = void 0;
const adminOnly = (req, res, next) => {
    const user = req.user;
    if (!user || !user.isAdmin)
        return res.status(403).json({ message: 'Admin only' });
    next();
};
exports.adminOnly = adminOnly;
