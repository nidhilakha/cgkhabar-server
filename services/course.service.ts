import { Request, Response, NextFunction } from "express";
import courseModel from "../models/course.model";
import { idText } from "typescript";
import { redis } from "../utils/redis";
import { catchAsyncError } from "../middleware/catchAsyncErros";

// get user by id
export const createCourse = catchAsyncError(async (data: any, res: Response) => {
    // const user=await userModel.findById(id);
    const course = await courseModel.create(data);
  
      res.status(201).json({
        success: true,
        course,
      });

  });

  // get all courses
export const getAllCoursesService = async ( res: Response) => {
  // const user=await userModel.findById(id);
  const courses=await courseModel.find().sort({createdAt:-1});
  
  
    res.status(201).json({
      success: true,
      courses,
    });

};