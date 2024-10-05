import bcrypt from "bcryptjs";
require("dotenv").config();
import jwt from "jsonwebtoken";
import mongoose, { Document, Model, Schema } from "mongoose";


export interface INewsCategory extends Document {
    name: string;
}

const newsCategorySchema = new Schema<INewsCategory>({
    name: {
        type: String,
        required: true,
        unique: true, // Ensures that each category name is unique
      
    },
}, { timestamps: true });

const NewsCategoryModel: Model<INewsCategory> = mongoose.model("NewsCategory", newsCategorySchema);
export default NewsCategoryModel;
