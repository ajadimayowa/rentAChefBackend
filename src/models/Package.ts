import mongoose, { Document, Schema, Types } from "mongoose";

export interface IPackage extends Document {
    title: string;
    description: string;
    packageImage?: string;

    menus: Types.ObjectId[];

    createdAt: Date;
    updatedAt: Date;
}

const PackageSchema = new Schema<IPackage>(
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

        packageImage: {
            type: String,
            default: null,
        },

        menus: [
            {
                type: Schema.Types.ObjectId,
                ref: "Menu",
            },
        ],
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

export default mongoose.model<IPackage>(
    "Package",
    PackageSchema
);