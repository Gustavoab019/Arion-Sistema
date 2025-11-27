import mongoose, { Schema, Document, Model } from "mongoose";
import type { ProductCategory } from "@/src/types/product";

export interface IProduct extends Document {
  nome: string;
  categoria: ProductCategory;
  descricao?: string;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

const ProductSchema = new Schema<IProduct>(
  {
    nome: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },
    categoria: {
      type: String,
      enum: ["calha", "cortinado", "acessorio"],
      required: true,
    },
    descricao: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export type ProductModel = Model<IProduct>;

const Product: ProductModel =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
