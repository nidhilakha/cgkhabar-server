import { Request, Response, NextFunction } from "express";

import ErrorHandler from "../utils/ErrorHandler";
import { catchAsyncError } from "../middleware/catchAsyncErros";
import { generateLast12MonthsData } from "../utils/analytics.generator";
import userModel from "../models/user.model";
import courseModel from "../models/course.model";
import orderModel from "../models/order.model";

// get user analytics
export const getUserAnalytics = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const users=await generateLast12MonthsData(userModel);
        res.status(200).json({
            success: true,
           users,
          });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
  );

//   get courses  analytics
export const getCourseAnalytics = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const courses=await generateLast12MonthsData(courseModel);
        res.status(200).json({
            success: true,
            courses,
          });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
  );

//   get orders analytics
export const getOrderAnalytics = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const orders=await generateLast12MonthsData(orderModel);
        res.status(200).json({
            success: true,
            orders,
          });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
  );