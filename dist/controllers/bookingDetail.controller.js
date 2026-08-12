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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookingDetail = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Booking_1 = require("../models/Booking");
const bookingStatus_1 = require("../utils/bookingStatus");
/**
 * Single booking detail — shared by the admin, chef and customer "view booking"
 * pages (each renders this same payload differently). Access is resolved from the
 * requester's role rather than three separate role-scoped endpoints: admins can
 * view any booking, chefs/customers only their own.
 */
const getBookingDetail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid booking ID" });
        }
        const booking = yield Booking_1.BookingModel.findById(id)
            .populate("customerId", "fullName email phoneNumber profilePic")
            .populate("chefId", "fullName email phoneNumber profilePic chefDetails.rating")
            .populate("serviceId", "name description");
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }
        const requester = req.user;
        const isAdmin = (requester === null || requester === void 0 ? void 0 : requester.userType) === "Admin";
        const isOwnerChef = (requester === null || requester === void 0 ? void 0 : requester.userType) === "Chef" && ((_b = (_a = booking.chefId) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) === String(requester._id);
        const isOwnerCustomer = (requester === null || requester === void 0 ? void 0 : requester.userType) === "Customer" && ((_d = (_c = booking.customerId) === null || _c === void 0 ? void 0 : _c._id) === null || _d === void 0 ? void 0 : _d.toString()) === String(requester._id);
        if (!isAdmin && !isOwnerChef && !isOwnerCustomer) {
            return res.status(403).json({ success: false, message: "You do not have access to this booking" });
        }
        const json = booking.toJSON();
        const { customerId, chefId, serviceId } = json, rest = __rest(json, ["customerId", "chefId", "serviceId"]);
        const pricing = rest.pricingSnapshot || {};
        return res.status(200).json({
            success: true,
            payload: Object.assign(Object.assign({}, rest), { customer: customerId || null, chef: chefId || null, service: serviceId || null, date: (0, bookingStatus_1.bestEffortBookingDate)(booking), guests: (0, bookingStatus_1.bestEffortGuestCount)(booking.bookingData), pricingSnapshot: Object.assign(Object.assign({}, pricing), { baseChefFee: (0, bookingStatus_1.minorToNaira)(pricing.baseChefFeeMinor || 0), estimatedTotal: (0, bookingStatus_1.minorToNaira)(pricing.estimatedTotalMinor || 0) }) }),
        });
    }
    catch (error) {
        console.error("Get Booking Detail Error:", error);
        return res.status(500).json({ success: false, message: "Error fetching booking", error });
    }
});
exports.getBookingDetail = getBookingDetail;
