"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCoursesService = exports.createCourse = void 0;
const course_model_1 = __importDefault(require("../models/course.model"));
const catchAsyncErros_1 = require("../middleware/catchAsyncErros");
// get user by id
exports.createCourse = (0, catchAsyncErros_1.catchAsyncError)(async (data, res) => {
    // const user=await userModel.findById(id);
    const course = await course_model_1.default.create(data);
    res.status(201).json({
        success: true,
        course,
    });
});
// get all courses
const getAllCoursesService = async (res) => {
    // const user=await userModel.findById(id);
    const courses = await course_model_1.default.find().sort({ createdAt: -1 });
    res.status(201).json({
        success: true,
        courses,
    });
};
exports.getAllCoursesService = getAllCoursesService;
