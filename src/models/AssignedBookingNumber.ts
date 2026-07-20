import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IAssignedBookingNumber extends Document {
	assignedNumber: number;
	serviceId: Types.ObjectId;
	customerId: Types.ObjectId;
	bookingId?: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

const AssignedBookingNumberSchema = new Schema<IAssignedBookingNumber>(
	{
		assignedNumber: {
			type: Number,
			required: true,
			min: 1,
		},
		serviceId: {
			type: Schema.Types.ObjectId,
			ref: "Service",
			required: true,
			index: true,
		},
		customerId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		bookingId: {
			type: Schema.Types.ObjectId,
			ref: "Booking",
			default: null,
			index: true,
		},
	},
	{
		timestamps: true,
		toJSON: {
			virtuals: true,
			versionKey: false,
			transform(_doc, ret: any) {
				ret.id = ret._id?.toString?.() || ret._id;
				delete ret._id;
				return ret;
			},
		},
	}
);

AssignedBookingNumberSchema.index({ serviceId: 1, assignedNumber: 1 }, { unique: true });
AssignedBookingNumberSchema.index({ serviceId: 1, createdAt: -1 });

export const AssignedBookingNumberModel: Model<IAssignedBookingNumber> = mongoose.model<IAssignedBookingNumber>(
	"AssignedBookingNumber",
	AssignedBookingNumberSchema,
	"assigned_booking_numbers"
);

