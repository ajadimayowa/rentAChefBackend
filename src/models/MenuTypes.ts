import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMenuTypes extends Document {
	title: string;
	description: string;
	packageId: Types.ObjectId;
	menus: Types.ObjectId[];
	createdAt: Date;
	updatedAt: Date;
}

const MenuTypesSchema = new Schema<IMenuTypes>(
	{
		title: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			required: true,
			trim: true,
		},
		packageId: {
			type: Schema.Types.ObjectId,
			ref: "Package",
			required: true
		},
		menus: {
			type: [
				{
					type: Schema.Types.ObjectId,
					ref: "Menu",
				},
			],
			default: [],
		},
	},
	{
		timestamps: true,
		toJSON: {
			virtuals: true,
			versionKey: false,
			transform(_doc, ret: any) {
				ret.id = ret._id;
				delete ret._id;
			},
		},
	}
);

export default mongoose.model<IMenuTypes>("MenuTypes", MenuTypesSchema);
