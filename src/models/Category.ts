import mongoose, { Schema, Document } from "mongoose";

export interface ICategoryService {
  label: string;
  price: number;
}

export interface ICategory extends Document {
  name: string;
  description: string;
  slug: string;
  image?: string;
  services: ICategoryService[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categoryServiceSchema = new Schema<ICategoryService>(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false } // services don’t need their own _id
);

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    services: {
      type: [categoryServiceSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(_doc, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

// 🔁 Auto-generate slug
categorySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }
  next();
});

const Category = mongoose.model<ICategory>("Category", categorySchema);
export default Category;