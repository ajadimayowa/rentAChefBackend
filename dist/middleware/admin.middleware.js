"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOnly = void 0;
const adminOnly = (req, res, next) => {
    const user = req.user;
    if (!user || user.userType !== 'Admin') {
        res.status(403).json({ message: 'Admin only' });
        return;
    }
    next();
};
exports.adminOnly = adminOnly;
