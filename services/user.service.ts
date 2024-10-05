import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/user.model";
import { idText } from "typescript";
import { redis } from "../utils/redis";

// get user by id
export const getUserById = async (id: string, res: Response) => {
  // const user=await userModel.findById(id);
  const userJSON = await redis.get(id);
  if (userJSON) {
    const user = JSON.parse(userJSON);
    res.status(201).json({
      success: true,
      user,
    });
  }
};


// get all users
export const getAllUsersService = async ( res: Response) => {
  // const user=await userModel.findById(id);
  const users=await userModel.find().sort({createdAt:-1});
  
  
    res.status(201).json({
      success: true,
      users,
    });

};

// update user role

export const updateUserRoleService = async (res: Response, email: string, role: string) => {
  try {
    // Update the user's role based on the email
    const user = await userModel.findOneAndUpdate(
      { email }, // Filter criteria
      { role },  // Update object
      { new: true, runValidators: true } // Options: return the updated document and run validation
    );

    // If no user is found, send a 404 response
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Send success response with updated user
    res.status(200).json({
      success: true,
      user, // Sending the updated user object
    });
  } catch (error:any) {
    // Handle unexpected errors
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};