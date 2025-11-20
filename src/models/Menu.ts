import { Schema, model, Document, Types } from 'mongoose';


export interface IMenuItem {
    name: string;
    price: number;
    description?: string;
}


export interface IMenu extends Document {
    chef: Types.ObjectId;
    title: string;
    items: IMenuItem[];
    createdAt: Date;
}


const MenuSchema = new Schema<IMenu>({
    chef: { type: Schema.Types.ObjectId, ref: 'Chef', required: true },
    title: { type: String, required: true },
    items: [
        {
            name: { type: String, required: true },
            price: { type: Number, required: true },
            description: { type: String }
        }
    ],
    createdAt: { type: Date, default: Date.now }
});


export default model<IMenu>('Menu', MenuSchema);