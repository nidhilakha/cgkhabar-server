import { Request, Response, NextFunction } from "express";
require("dotenv").config();
import userModel, { IUser ,ICourse} from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsyncError } from "../middleware/catchAsyncErros";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import bcrypt from 'bcryptjs'; // For hashing passwords

import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import {
  accessTokenOptions,
  refreshTokenOptions,
  sendToken,
} from "../utils/jwt";
import { redis } from "../utils/redis";
import { getAllUsersService, getUserById, updateUserRoleService } from "../services/user.service";
import cloudinary from "cloudinary";

import dotenv from 'dotenv';


dotenv.config();
const ImageToBase64=require('image-to-base64');
interface FeaturedImageFile {
  fieldName: string;
  originalFilename: string;
  path: string;
  headers: {
    'content-disposition': string;
    'content-type': string;
  };
  size: number;
  name: string;
  type: string;
}

// register user
interface IRegisterationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export const registrationUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body;
      const isEmailExist = await userModel.findOne({ email });
      if (isEmailExist) {
        return next(new ErrorHandler("Email already exists", 400));
      }

      const user: IRegisterationBody = {
        name,
        email,
        password,
      };

      const activationToken = createActivationToken(user);
      const activationCode = activationToken.activationCode;
      const data = { user: { name: user.name }, activationCode };
      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/activation-mail.ejs"),
        data
      );
      try {
        await sendMail({
          email: user.email,
          subject: "Activate your account",
          template: "activation-mail.ejs",
          data,
        });

        res.status(201).json({
          success: true,
          message: `Please check your email ${user.email} to activate your account.`,
          activationToken: activationToken.token,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);




// admmin registration
export const registerAdmin = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body;
      const file = req.files?.profile_picture as unknown as FeaturedImageFile;
      const base64Data = await ImageToBase64(file.path);

      // Check if email already exists
      const isEmailExist = await userModel.findOne({ email });
      if (isEmailExist) {
        return next(new ErrorHandler("Email already exists", 400));
      }

      // Create the admin user object
      const adminUser = new userModel({
        name,
        email,
        password,
        role: "admin",  // Set the role as "admin"
        profile_picture: `data:${file.type};base64,${base64Data}`,

      });

      // Save the admin user to the database
      await adminUser.save();

      res.status(201).json({
        success: true,
        message: `Admin account created for ${adminUser.email}`,
        user: {
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
        },
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);



interface IActivationToken {
  token: string;
  activationCode: string;
}
export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(100 + Math.random() * 9000).toString();
  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_SECRET as Secret,
    {
      expiresIn: "5m",
    }
  );

  return { token, activationCode };
};

// activate user

interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

export const activateUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token, activation_code } =
        req.body as IActivationRequest;
      const newUser: { user: IUser; activationCode: string } = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as string
      ) as { user: IUser; activationCode: string };

      if (newUser.activationCode !== activation_code) {
        return next(new ErrorHandler("Invalid activation code", 400));
      }

      const { name, email, password } = newUser.user;
      const existUser = await userModel.findOne({ email });
      if (existUser) {
        return next(new ErrorHandler("Email already exist", 400));
      }

      const user = await userModel.create({
        name,
        email,
        password,
      });

      res.status(201).json({
        success: true,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// LOGIIN USER

interface ILoginRequest {
  email: string;
  password: string;
}

export const loginUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest;
      if (!email || !password) {
        return next(new ErrorHandler("Please enter email and password", 400));
      }

      const user = await userModel.findOne({ email }).select("+password");
      if (!user) {
        return next(new ErrorHandler("Invalid email or password", 400));
      }

      const isPasswordMatch = await user.comparePassword(password);
      if (!isPasswordMatch) {
        return next(new ErrorHandler("Invalid email or password", 400));
      }

      sendToken(user, 200, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// logout user
export const logoutUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });
      const userId = (req.user?._id as string) || "";
      redis.del(userId);
      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// update access token
export const updateAccessToken = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // const refresh_token =req.headers["refresh-token"]  as string;
      // console.log("Request headers:", req.headers);
      const refresh_token = req.cookies.refresh_token as string;
      console.log("Received refresh token from cookies:", refresh_token);

      if (!refresh_token) {
        return next(new ErrorHandler("Refresh token must be provided", 400));
      }

      const decoded = jwt.verify(
        refresh_token,
        process.env.REFRESH_TOKEN as string
      ) as JwtPayload;
      const message = "Could not refresh token";
      if (!decoded) {
        return next(new ErrorHandler(message, 400));
      }
      const session = await redis.get(decoded.id as string);
      if (!session) {
        return next(new ErrorHandler("Please login to access this resources!", 400));
      }
      const user = JSON.parse(session);
      const accessToken = jwt.sign(
        { id: user._id },
        process.env.ACCESS_TOKEN as string,
        {
          expiresIn: "10m",
        }
      );

      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN as string,
        {
          expiresIn: "3d",
        }
      );

      req.user = user;

      res.cookie("access_token", accessToken, accessTokenOptions);
      res.cookie("refresh_token", refreshToken, refreshTokenOptions);

      await redis.set(user._id,JSON.stringify(user),"EX",604800);   //expire after 7 days(604800 seconds) 
      res.status(200).json({
        status: "success",
        accessToken,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// GET USER INFO
export const getUserInfo = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id as string;
      getUserById(userId, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// social auth
interface ISocialAuthBody {
  email: string;
  name: string;
  avatar: string;
  // password:string;
}

export const socialAuth = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, avatar } = req.body as ISocialAuthBody;
      // const { email, name, password } = req.body as ISocialAuthBody;

      const user = await userModel.findOne({ email });
      if (!user) {
        const newUser = await userModel.create({ email, name, avatar });
        // const newUser = await userModel.create({ email, name, password });

        sendToken(newUser, 200, res);
      } else {
        sendToken(user, 200, res);
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

interface IUpdateUserInfo {
  email?: string;
  name?: string;
  courses?: ICourse; // Adjust the interface to match your schema
}

export const updateUserInfo = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, courses } = req.body as IUpdateUserInfo;
      const userId = req.user?._id as string;

      const user = await userModel.findById(userId);
      if (!user) {
        return next(new ErrorHandler('User not found', 404));
      }

    

      if (name) {
        user.name = name;
      }

      if (courses) {
        const existingCourseIndex = user.courses.findIndex(
          (c: ICourse) => c.courseId === courses.courseId
        );

        if (existingCourseIndex > -1) {
          // Update existing course
          user.courses[existingCourseIndex] = courses;
        } else {
          // Add new course
          user.courses.push(courses);
        }
      }

      await user.save();
      await redis.set(userId, JSON.stringify(user));

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// update user password
interface IUpdateUserPassword {
  oldPassword: string;
  newPassword: string;
}

export const updateUserPassword = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { oldPassword, newPassword } = req.body as IUpdateUserPassword;
      if (!oldPassword || !newPassword) {
        return next(
          new ErrorHandler("Please enter old password and new password", 404)
        );
      }
      const user = await userModel.findById(req.user?._id).select("+password");
      if (user?.password == undefined) {
        return next(new ErrorHandler("Invalid User", 404));
      }

      const isPasswordMatch = await user?.comparePassword(oldPassword);
      if (!isPasswordMatch) {
        return next(new ErrorHandler("Invalid old password", 404));
      }

      user.password = newPassword;
      await user.save();
      res.status(201).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);


// sign in as admin
export const addUserAsAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role, profile_picture } = req.body; // Added avatar

    // Check if email already exists
    const isEmailExist = await userModel.findOne({ email });
    if (isEmailExist) {
      return next(new ErrorHandler("Email already exists", 400));
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create a new user
    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
      role, // Admin should specify the role (e.g., "user", "admin")
    });

    // Handle profile picture upload
    if (profile_picture) {
      // Convert base64 to Blob (if required)
      const blob = await fetch(profile_picture).then(res => res.blob());
      
      // Upload the new avatar
      const myCloud = await cloudinary.v2.uploader.upload(profile_picture, {
        folder: "avatars",
        width: 150,
      });

      newUser.avatar = {
        public_id: myCloud.public_id,
        url: myCloud.url,
      };
    }

    // Save the user to the database
    await newUser.save();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar: newUser.avatar, // Return avatar info
      },
    });
  } catch (error) {
    return next(new ErrorHandler(error, 500));
  }
};

// upadte profile pictureb
interface IUpdateProfilePicture {
  avatar: string;
}

export const updateProfilePicture = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { avatar } = req.body; // Expect avatar to be a base64-encoded string

      if (!avatar) {
        return next(new ErrorHandler("No profile picture uploaded", 404));
      }

      const userId = req.user?._id as string;
      const user = await userModel.findById(userId);

      if (avatar && user) {
        // If user has an existing avatar, delete it
        if (user?.avatar?.public_id) {
          await cloudinary.v2.uploader.destroy(user?.avatar?.public_id);
        }
console.log("avatar deleted");
        // Upload the new avatar
        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
          folder: "avatars",
          width: 150,
        });

        user.avatar = {
          public_id: myCloud.public_id,
          url: myCloud.url,
        };
        console.log("avatar uploaded");

        await user.save();
        await redis.set(userId, JSON.stringify(user));

        return res.status(200).json({
          success: true,
          user,
        });
      }

      return next(new ErrorHandler("User not found", 404));
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get all users
export const getAllUsers = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllUsersService(res);
      
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// update user role by admin
export const updateUserRole = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
     const {email,role}=req.body;
     updateUserRoleService(res,email,role);
      
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// delete user
export const deleteUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
     const {id}=req.params;
const user=await userModel.findById(id);
if(!user){
  return next(new ErrorHandler("User not found", 404));

}   
await user.deleteOne({id});   
await redis.del(id);
res.status(201).json({
  success: true,
  message:"User deleted successfully",
});

    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);


export const updateUserProfilePicture = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.files);
    try {
      const userId = req.user?._id as string;
      console.log(req.files); // Check the content of req.files

      const file = req.files?.profile_picture as unknown as FeaturedImageFile;
      if (!userId) {
        return next(new ErrorHandler("User ID is required", 400));
      }

      if (!file) {
        return next(new ErrorHandler("No profile picture uploaded", 400));
      }

      // Handle image update
      const base64Data = await ImageToBase64(file.path);
      const profilePictureUrl = `data:${file.type};base64,${base64Data}`;

      const user = await userModel.findById(userId);

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      // If user has an existing profile picture, delete it
      if (user.profile_picture) {
        // Assuming you want to delete the old image from Cloudinary
        // Adjust the deletion logic if you're storing the URL directly
        const oldImagePublicId = user.profile_picture.split('/').pop()?.split('.')[0]; // Extract public_id from URL
        if (oldImagePublicId) {
          await cloudinary.v2.uploader.destroy(oldImagePublicId);
        }
      }

      // Upload the new profile picture
      const uploadedPicture = await cloudinary.v2.uploader.upload(profilePictureUrl, {
        folder: "profile_pictures",
        width: 150,
        crop: "scale"
      });

      user.profile_picture = uploadedPicture.secure_url;

      await user.save();
      await redis.set(userId, JSON.stringify(user));

      res.status(200).json({
        success: true,
        message: "Profile picture updated successfully",
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);