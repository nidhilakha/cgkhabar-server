"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
require("dotenv").config();
const reviewSchema = new mongoose_1.default.Schema({
    user: Object,
    rating: {
        type: Number,
        default: 0,
    },
    comment: String,
    commentReplies: [Object],
});
const linkSchema = new mongoose_1.default.Schema({
    title: String,
    url: String,
});
const commentSchema = new mongoose_1.default.Schema({
    user: Object,
    question: String,
    questionReplies: [Object],
});
const courseDataSchema = new mongoose_1.default.Schema({
    title: String,
    description: String,
    videoUrl: String,
    videoSection: String,
    videoLength: Number,
    videoPlayer: String,
    links: [linkSchema],
    suggestion: String,
    questions: [commentSchema],
});
const courseSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        // required: true,
    },
    description: {
        type: String,
        // required: true,
    },
    categories: {
        type: String,
        // required: true,
    },
    price: {
        type: Number,
        // required: true,
    },
    estimatedPrice: Number,
    thumbnail: {
        public_id: {
            type: String,
        },
        url: {
            type: String,
        },
    },
    tags: {
        type: String,
    },
    level: {
        // required: true,
        type: String,
    },
    demoUrl: {
        // required: true,
        type: String,
    },
    benefits: [{ title: String }],
    prerequisites: [{ title: String }],
    reviews: [reviewSchema],
    courseData: [courseDataSchema],
    ratings: {
        type: Number,
        default: 0,
    },
    purchased: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });
const courseModel = mongoose_1.default.model("Course", courseSchema);
exports.default = courseModel;
