import { Request, Response, NextFunction } from "express";
import { catchAsyncError } from "../middleware/catchAsyncErros";
import ErrorHandler from "../utils/ErrorHandler";
import NewsCategoryModel from "../models/NewsCategory.model";


// Add news category
export const addNewsCategory = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = req.body;

      if (!name) {
        return next(new ErrorHandler("Category name is required", 400));
      }

      // Check if the category already exists
      const existingCategory = await NewsCategoryModel.findOne({ name });
      if (existingCategory) {
        return next(new ErrorHandler("Category already exists", 400));
      }

      const newCategory = await NewsCategoryModel.create({ name });

      res.status(201).json({
        success: true,
        message: "News category added successfully",
        category: newCategory,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);


// get all categories
// Get all news categories
export const getAllNewsCategories = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const categories = await NewsCategoryModel.find();
  
        res.status(200).json({
          success: true,
          categories,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
  );
// New method to get a news category by ID
export const getNewsCategoryById = async (req: Request, res: Response) => {
  try {
      const categoryId = req.params.id;
      const category = await NewsCategoryModel.findById(categoryId);

      if (!category) {
          return res.status(404).json({ message: "Category not found" });
      }

      res.status(200).json(category);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
  }
};
  
//   update category 
// Update news category
export const updateNewsCategory = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const { name } = req.body;
  
        if (!name) {
          return next(new ErrorHandler("Category name is required", 400));
        }
  
        const category = await NewsCategoryModel.findById(id);
  
        if (!category) {
          return next(new ErrorHandler("Category not found", 404));
        }
  
        category.name = name;
        await category.save();
  
        res.status(200).json({
          success: true,
          message: "News category updated successfully",
          category,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
  );

//   delete category 
// Delete news category
export const deleteNewsCategory = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
  
        const category = await NewsCategoryModel.findById(id);
  
        if (!category) {
          return next(new ErrorHandler("Category not found", 404));
        }
  
        // Use findByIdAndDelete to remove the document
        await NewsCategoryModel.findByIdAndDelete(id);
  
        res.status(200).json({
          success: true,
          message: "News category deleted successfully",
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
  );
  
  