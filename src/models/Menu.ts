import { Schema, model, Types, Document } from "mongoose";

interface IProcurement {
  title: string;
  description?: string;
  price: number;
}

/* ---------- Day Schema ---------- */
interface IMenuDay {
  day: string; // e.g. "Monday"
  breakfast: string;
  lunch: string;
  dinner: string;
}


const ProcurementSchema = new Schema<IProcurement>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const MenuDaySchema = new Schema<IMenuDay>(
  {
    day: {
      type: String,
      required: true,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
    },
    breakfast: { type: String, required: true },
    lunch: { type: String, required: true },
    dinner: { type: String, required: true },
  },
  { _id: false }
);

/* ---------- Week Schema ---------- */
interface IMenuWeek {
  weekNumber: number; // 1 - 5
  days: IMenuDay[];
}

const MenuWeekSchema = new Schema<IMenuWeek>(
  {
    weekNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    days: {
      type: [MenuDaySchema],
      required: true,
      validate: [(v: any[]) => v.length > 0, "Days cannot be empty"],
    },
  },
  { _id: false }
);

/* ---------- Menu Schema ---------- */
export interface IMenu extends Document {
  chefId: Types.ObjectId;
  month: string; // YYYY-MM
  weeks: IMenuWeek[];
  createdBy: "chef" | "admin";
  menuPic: string;
  procurement: IProcurement[];
  approved: boolean;
}

const MenuSchema = new Schema<IMenu>(
  {
    chefId: {
      type: Schema.Types.ObjectId,
      ref: "Chef",
      required: true,
      index: true,
    },

    month: {
      type: String,
      required: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/, // YYYY-MM
      index: true,
    },

    weeks: {
      type: [MenuWeekSchema],
      required: true,
      validate: [(v: any[]) => v.length > 0, "Weeks cannot be empty"],
    },

    procurement: {
      type: [ProcurementSchema],
      default: [],
    },

    menuPic: {
      type: String,
      required: true,
    },

    createdBy: {
      type: String,
      enum: ["chef", "admin"],
      required: true,
    },

    approved: {
      type: Boolean,
      default: false,
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

/* ---------- Prevent Duplicate Menu per Chef per Month ---------- */
MenuSchema.index({ chefId: 1, month: 1 }, { unique: true });

export const Menu = model<IMenu>("Menu", MenuSchema);