"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const mongoose_2 = require("mongoose");
const faqSchema = new mongoose_2.Schema({
    question: { type: String },
    answer: { type: String },
});
const categorySchema = new mongoose_2.Schema({
    title: { type: String },
});
const bannerImageSchema = new mongoose_2.Schema({
    public_id: { type: String },
    url: { type: String },
});
const layoutSchema = new mongoose_2.Schema({
    type: { type: String },
    faq: [faqSchema],
    categories: [categorySchema],
    banner: {
        image: bannerImageSchema,
        title: { type: String },
        subTitle: { type: String },
    }
});
const layoutModel = mongoose_1.default.model("Layout", layoutSchema);
exports.default = layoutModel;
//   const layoutModel=Model<Layout>('Layout',layoutSchema);
