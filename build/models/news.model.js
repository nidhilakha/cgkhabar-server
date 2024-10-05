"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// Reply Schema
const replySchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User', // Reference to User model
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
// Comment Schema
const commentSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User', // Reference to User model
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    replies: [replySchema],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
// News Schema
const newsSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String, // Store content from editor, which can include HTML
        required: true,
    },
    likes: {
        type: Number,
        default: 0,
    },
    category: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "NewsCategory",
        required: true,
    },
    comments: [commentSchema], // Updated to use commentSchema
    featured_image: {
        type: String, // URL to the image
        required: false, // Optional field
    },
    featured_video: {
        type: String, // URL to the video
        required: false, // Optional field
    },
    banner: {
        type: Number,
        default: 0, // Default value is 0
    },
    author: {
        type: String,
    },
    yt_url: {
        type: String, // URL to the image
        required: false, // Optional field
    },
    reel_url: {
        type: String, // URL to the image
        required: false, // Optional field
    }
}, { timestamps: true });
// Create Models
const NewsModel = mongoose_1.default.model('News', newsSchema);
exports.default = NewsModel;
