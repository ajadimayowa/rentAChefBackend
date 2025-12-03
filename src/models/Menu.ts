import { Schema, model, Document, Types } from 'mongoose';


export interface IMenuItem {
    name: string;
    price: number;
    menuPic?:string;
    description?: string;
}


export interface IMenu extends Document {
    chef: Types.ObjectId;
    title: string;
    menuPic:string;
    items: IMenuItem[];
    basePrice:number;
    createdAt: Date;
}


const MenuSchema = new Schema<IMenu>({
    chef: { type: Schema.Types.ObjectId, ref: 'Chef', required: true },
    title: { type: String, required: true },
    menuPic:{type: String},
    basePrice:{type: Number, required: true },
    items: [
        {
            name: { type: String, required: true },
            price: { type: Number, required: true },
            description: { type: String }
        }
    ],
    createdAt: { type: Date, default: Date.now }
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
  });


export default model<IMenu>('Menu', MenuSchema);