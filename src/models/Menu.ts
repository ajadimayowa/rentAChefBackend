import mongoose, { Schema, Document, Types } from "mongoose";

export interface IGrocery {
  groceryName: string;
  description?: string;
  unitPrice: number;
}

export type MenuCreatorType = "chef" | "organization";
export type MenuType = "breakfast" | "lunch" | "dinner";
export type MenuClass = "nigerian" | "continental" | "intercontinental";
export type PricingModel = "perhead" | "plater";
/** Tier a menu is sold under, e.g. on the date night "Choose your menu" step. */
export type MenuKind = "classic" | "premium" | "signature";
export const MENU_KINDS: MenuKind[] = ["classic", "premium", "signature"];


export interface IMenu extends Document {
  menuCreatorType: MenuCreatorType;

  title: string;

  description: string;

  samplePicture?: string;

  isSignatureMenu: boolean;

  menuType: MenuType;

  menuClass?: MenuClass;

  pricingModel?: PricingModel;

  menuKind?: MenuKind;

  /** Courses or features shown on the menu card, in order, e.g. ["Starter", "Main", "Dessert"]. */
  attributes: string[];

  menuCategory: Types.ObjectId[];

  /** First of serviceIds — kept for older clients that read a single service. */
  relatedServiceId?: Types.ObjectId;

  /** Every service this menu is offered on. */
  serviceIds: Types.ObjectId[];

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

    serviceIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Service" }],
      default: [],
      index: true,
    },
    
    menuType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner"],
      required: true,
    },

    menuClass: {
      type: String,
      enum: ["nigerian", "continental", "intercontinental"],
      required: false,
    },

    pricingModel: {
      type: String,
      enum: ["perhead", "plater"],
      required: false,
    },

    menuKind: {
      type: String,
      enum: MENU_KINDS,
      required: false,
      index: true,
    },

    attributes: {
      type: [{ type: String, trim: true }],
      default: [],
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
        // Menus saved before serviceIds existed report their single service.
        if ((!Array.isArray(ret.serviceIds) || ret.serviceIds.length === 0) && ret.relatedServiceId) {
          ret.serviceIds = [ret.relatedServiceId];
        }
        return ret;
      },
    },
  }
);

Menu.pre("save", function (next) {
  // Keep the single-service field in step with the list.
  if (this.serviceIds?.length) {
    this.relatedServiceId = this.serviceIds[0];
  } else if (this.relatedServiceId) {
    this.serviceIds = [this.relatedServiceId] as any;
  }

  const groceries = Array.isArray(this.groceries) ? this.groceries : [];

  this.totalGroceryCost = groceries.reduce(
    (sum, grocery) => sum + Number(grocery?.unitPrice || 0),
    0
  );

  next();
});

export default mongoose.model<IMenu>("Menu", Menu);