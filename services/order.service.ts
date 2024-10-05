import { Request, Response, NextFunction } from "express";
import courseModel from "../models/course.model";
import { idText } from "typescript";
import { redis } from "../utils/redis";
import { catchAsyncError } from "../middleware/catchAsyncErros";
import orderModel from "../models/order.model";

// get user by id
export const newOrder = async (data: any,res: Response, next: NextFunction) => {
 
      const order = await orderModel.create(data);
      res.status(201).json({
        success: true,
        order,
      });
    
  };

  // get all orders sort by desc
  export const getAllOrdersService = async (res: Response) => {
    try {
      const orders = await orderModel.find().sort({ createdAt: -1 });
      res.status(201).json({
        success: true,
        orders,
      });
    } catch (error:any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };