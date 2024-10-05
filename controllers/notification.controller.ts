import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import notificationModel from "../models/notification.model";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsyncError } from "../middleware/catchAsyncErros";
import cron from "node-cron";

// push new notification on top ie sorting
export const getNotification = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
      const notifications=await notificationModel.find().sort({createdAt:-1});
      res.status(201).json({
        success: true,
        notifications,
      });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
      }
    }
  );


//   upodate notification status
export const updateNotification = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
      const notifications=await notificationModel.findById(req.params.id);
      if(!notifications){
        return next(new ErrorHandler("Notification not found", 400));

      }else{
        notifications.status?notifications.status='read': notifications.status;

      }
await notifications.save();
const notification=await notificationModel.find().sort({createdAt:-1});
      res.status(201).json({
        success: true,
        notifications,
      });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
      }
    }
  );


//  delete notification----------only admin


cron.schedule("0 0 0 * * *", async() =>{
  const thirtyDaysAgo=new Date(Date.now()-30*2);
await notificationModel.deleteMany({status:"read",createdAt:{$lt:thirtyDaysAgo}});
console.log('Deleted read notifications');
});

