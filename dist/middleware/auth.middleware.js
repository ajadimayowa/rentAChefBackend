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
exports.isCreator = exports.isSuperAdmin = exports.verifyUserToken = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_model_1 = __importDefault(require("../models/User.model"));
// export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader) return res.status(401).json({ msg: 'No token' });
//   try {
//     const token = authHeader.split(' ')[1];
//     const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
//     const user = await User.findById(decoded.id);
//     if (!user) return res.status(403).json({ msg: 'Invalid token' });
//     (req as any).user = user;
//     next();
//   } catch (err) {
//     res.status(401).json({ msg: 'Token failed' });
//   }
// };
const verifyToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ msg: 'No token provided' });
        return;
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = yield User_model_1.default.findById(decoded.id);
        if (!user) {
            res.status(403).json({ msg: 'Invalid token' });
            return;
        }
        req.user = user;
        next(); // ✅ move on to controller
    }
    catch (err) {
        res.status(401).json({ msg: 'Token failed' });
    }
});
exports.verifyToken = verifyToken;
// export const verifyRootAdminToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader) {
//     res.status(401).json({ msg: 'No token provided' });
//     return;
//   }
//   try {
//     const token = authHeader.split(' ')[1];
//     const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
//     const creator = await Creator.findById(decoded.id);
//     if (!creator) {
//       res.status(403).json({ msg: 'Invalid token' });
//       return;
//     }
//     (req as any).user = creator;
//     next(); // ✅ move on to controller
//   } catch (err) {
//     res.status(401).json({ msg: 'Token failed' });
//   }
// };
const verifyUserToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ msg: 'No token provided' });
        return;
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = yield User_model_1.default.findById(decoded.id);
        if (!user) {
            res.status(403).json({ msg: 'Invalid token' });
            return;
        }
        req.user = user;
        next(); // ✅ move on to controller
    }
    catch (err) {
        res.status(401).json({ msg: 'Token failed' });
    }
});
exports.verifyUserToken = verifyUserToken;
const isSuperAdmin = (req, res, next) => {
    const user = req.user;
    if (!(user === null || user === void 0 ? void 0 : user.isSuperAdmin)) {
        res.status(403).json({ success: false, message: 'Un Authorised User!' });
        return;
    }
    ;
    next();
};
exports.isSuperAdmin = isSuperAdmin;
const isCreator = (req, res, next) => {
    const { creatorPass } = req.body;
    if (creatorPass !== process.env.CREATOR_PASS) {
        res.status(403).json({ success: false, message: 'Un Authorised User!' });
        return;
    }
    ;
    next();
};
exports.isCreator = isCreator;
