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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChefAssignmentEngine = void 0;
const enums_1 = require("../../domain/enums");
class ChefAssignmentEngine {
    constructor(bookingRepository, chefRepository) {
        this.bookingRepository = bookingRepository;
        this.chefRepository = chefRepository;
    }
    autoAssignChef(bookingId, actorId) {
        return __awaiter(this, void 0, void 0, function* () {
            const booking = yield this.bookingRepository.findById(bookingId);
            if (!booking)
                return null;
            if (!booking.chefLevel)
                return null;
            if (!booking.serviceId)
                return null;
            const candidates = yield this.chefRepository.findAssignableChefs({
                chefLevel: booking.chefLevel,
                serviceId: booking.serviceId,
            });
            if (!candidates.length)
                return null;
            const selected = candidates[0];
            yield this.bookingRepository.updateById(booking.id, {
                assignedChefId: selected.id,
                status: enums_1.BookingStatus.CHEF_ASSIGNED,
                timeline: [
                    ...booking.timeline,
                    {
                        status: enums_1.BookingStatus.CHEF_ASSIGNED,
                        changedBy: actorId,
                        changedAt: new Date(),
                    },
                ],
            });
            return selected;
        });
    }
}
exports.ChefAssignmentEngine = ChefAssignmentEngine;
