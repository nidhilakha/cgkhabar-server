"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNewsCategory = exports.updateNewsCategory = exports.getNewsCategoryById = exports.getAllNewsCategories = exports.addNewsCategory = void 0;
const catchAsyncErros_1 = require("../middleware/catchAsyncErros");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const NewsCategory_model_1 = __importDefault(require("../models/NewsCategory.model"));
// Add news category
exports.addNewsCategory = (0, catchAsyncErros_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { name } = req.body;
        if (!name) {
            return next(new ErrorHandler_1.default("Category name is required", 400));
        }
        // Check if the category already exists
        const existingCategory = await NewsCategory_model_1.default.findOne({ name });
        if (existingCategory) {
            return next(new ErrorHandler_1.default("Category already exists", 400));
        }
        const newCategory = await NewsCategory_model_1.default.create({ name });
        res.status(201).json({
            success: true,
            message: "News category added successfully",
            category: newCategory,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// get all categories
// Get all news categories
exports.getAllNewsCategories = (0, catchAsyncErros_1.catchAsyncError)(async (req, res, next) => {
    try {
        const categories = await NewsCategory_model_1.default.find();
        res.status(200).json({
            success: true,
            categories,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// New method to get a news category by ID
const getNewsCategoryById = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await NewsCategory_model_1.default.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        res.status(200).json(category);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.getNewsCategoryById = getNewsCategoryById;
//   update category 
// Update news category
exports.updateNewsCategory = (0, catchAsyncErros_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) {
            return next(new ErrorHandler_1.default("Category name is required", 400));
        }
        const category = await NewsCategory_model_1.default.findById(id);
        if (!category) {
            return next(new ErrorHandler_1.default("Category not found", 404));
        }
        category.name = name;
        await category.save();
        res.status(200).json({
            success: true,
            message: "News category updated successfully",
            category,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
//   delete category 
// Delete news category
exports.deleteNewsCategory = (0, catchAsyncErros_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { id } = req.params;
        const category = await NewsCategory_model_1.default.findById(id);
        if (!category) {
            return next(new ErrorHandler_1.default("Category not found", 404));
        }
        // Use findByIdAndDelete to remove the document
        await NewsCategory_model_1.default.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: "News category deleted successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
