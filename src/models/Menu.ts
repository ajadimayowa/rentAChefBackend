import mongoose, { Schema, Document, Types } from "mongoose";

export interface IGrocery {
  groceryName: string;
  description?: string;
  unitPrice: number;
}

export type MenuCreatorType = "chef" | "organization";
export type MenuType = "breakfast" | "lunch" | "dinner";
export type MenuClass = "nigerian" | "continental";
export type PricingModel = "perhead" | "plater";


export interface IMenu extends Document {
  menuCreatorType: MenuCreatorType;

  title: string;

  description: string;

  samplePicture?: string;

  isSignatureMenu: boolean;

  menuType: MenuType;

  menuClass?: MenuClass;

  pricingModel?: PricingModel;

  menuCategory: Types.ObjectId[];

  relatedServiceId?: Types.ObjectId;

  pricePerHead: number;

  // Package references
  packages: Types.ObjectId[];

  // Only applicable when menuCreatorType === "chef"
  chefId?: Types.ObjectId;

  groceries: Types.DocumentArray<IGrocery>;

  // Calculated server-side
  totalGroceryCost: number;

  createdAt: Date;
  updatedAt: Date;
}

const GrocerySchema = new Schema<IGrocery>(
  {
    groceryName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: function (_doc, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

const Menu = new Schema<IMenu>(
  {
    menuCreatorType: {
      type: String,
      enum: ["chef", "organization"],
      required: true,
    },

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

    isSignatureMenu: {
      type: Boolean,
      required: function () {
        return this.menuCreatorType === "chef";
      },
    },

    relatedServiceId:{
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    
    menuType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner"],
      required: true,
    },

    menuClass: {
      type: String,
      enum: ["nigerian", "continental"],
      required: false,
    },

    pricingModel: {
      type: String,
      enum: ["perhead", "plater"],
      required: false,
    },

    samplePicture: {
      type: String,
      trim: true,
      default: null,
    },

    menuCategory: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "MenuTypes",
        },
      ],
      default: [],
    },

    pricePerHead: {
      type: Number,
      required: true,
      min: 0,
    },

    chefId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: function (this: IMenu) {
        return this.menuCreatorType === "chef";
    },
},
    packages: {
      type: [{
        type: Schema.Types.ObjectId,
        ref: "Package",
      }],
      default: [],
    },

    groceries: {
      type: [GrocerySchema],
      default: [],
    },

    totalGroceryCost: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: function (_doc, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

Menu.pre("save", function (next) {
  const groceries = Array.isArray(this.groceries) ? this.groceries : [];

  this.totalGroceryCost = groceries.reduce(
    (sum, grocery) => sum + Number(grocery?.unitPrice || 0),
    0
  );

  next();
});

export default mongoose.model<IMenu>("Menu", Menu);