import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import userModel,{ICourse} from "../models/user.model";
import courseModel from "../models/course.model";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsyncError } from "../middleware/catchAsyncErros";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import { getAllOrdersService, newOrder } from "../services/order.service";
import notificationModel from "../models/notification.model";


// create order
export const createOrder = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, payment_info } = req.body;
      const user = await userModel.findById(req.user?._id);

      if (!user) {
        return next(new ErrorHandler("Invalid user id", 404));
      }

      // Check if the course is already in the user's courses
      const courseExistInUser = user.courses.some(
        (course: ICourse) => course.courseId === courseId
      );

      if (courseExistInUser) {
        return next(
          new ErrorHandler("You have already purchased this course", 404)
        );
      }

      const course = await courseModel.findById(courseId);

      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      const data = {
        courseId: course._id,
        userId: user._id,
        payment_info,
      };

      const mailData = {
        order: {
          _id: (course._id as any).toString().slice(0, 6),
          name: course.name,
          price: course.price,
          date: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        },
      };

      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/order-confirmation.ejs"),
        { order: mailData }
      );

      try {
        if (user) {
          await sendMail({
            email: user.email,
            subject: "Order Confirmation",
            template: "order-confirmation.ejs",
            data: mailData,
          });
        }
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
      }

      // Ensure the correct structure based on schema
      user.courses.push({ courseId: (course._id as any).toString() });

      await user.save(); // Save the updated user document

      await notificationModel.create({
        user: user._id,
        title: "New Order",
        message: `You have a new order from ${course.name}`,
      });
      
        course.purchased?course.purchased+=1:course.purchased;
      
      await course.save();
      newOrder(data, res, next);

    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);


// get all order only for admin
export const getAllOrders = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await getAllOrdersService(res);
    } catch (error: any) {
      next(new ErrorHandler(error.message, 400));
    }
  }
);

