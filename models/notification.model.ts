import mongoose, { Document, Model, Schema } from "mongoose";

import jwt from "jsonwebtoken";
require('dotenv').config();

export interface INotification extends Document {
    title: string;
    message: string;
    status: string;
    userId: string;
   
  }

  const notificationSchema=new Schema<INotification>({
    title: {
        type: String,
        required: true,
      },
      userId: {
        type: String,
   
      },
      message: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        required: true,
        default:"unread",
      },
      
  },{timestamps:true});

  const notificationModel: Model<INotification> = mongoose.model("Notification", notificationSchema);
export default notificationModel;