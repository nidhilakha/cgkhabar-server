"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserProfilePicture = exports.deleteUser = exports.updateUserRole = exports.getAllUsers = exports.updateProfilePicture = exports.addUserAsAdmin = exports.updateUserPassword = exports.updateUserInfo = exports.socialAuth = exports.getUserInfo = exports.updateAccessToken = exports.logoutUser = exports.loginUser = exports.activateUser = exports.createActivationToken = exports.registerAdmin = exports.registrationUser = void 0;
require("dotenv").config();
const user_model_1 = __importDefault(require("../models/user.model"));
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const catchAsyncErros_1 = require("../middleware/catchAsyncErros");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs")); // For hashing passwords
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const jwt_1 = require("../utils/jwt");
const redis_1 = require("../utils/redis");
const user_service_1 = require("../services/user.service");
const cloudinary_1 = __importDefault(require("cloudinary"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const ImageToBase64 = require('image-to-base64');
exports.registrationUser = (0, catchAsyncErros_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const isEmailExist = await user_model_1.default.findOne({ email });
        if (isEmailExist) {
            return next(new ErrorHandler_1.default("Email already exists", 400));
        }
        const user = {
            name,
            email,
            password,
        };
        const activationToken = (0, exports.createActivationToken)(user);
        const activationCode = activationToken.activationCode;
        const data = { user: { name: user.name }, activationCode };
        const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/activation-mail.ejs"), data);
        try {
            await (0, sendMail_1.default)({
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
        }
        catch (error) {
            return next(new ErrorHandler_1.default(error.message, 400));
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// admmin registration
exports.registerAdmin = (0, catchAsyncErros_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const file = req.files?.profile_picture;
        const base64Data = await ImageToBase64(file.path);
        // Check if email already exists
        const isEmailExist = await user_model_1.default.findOne({ email });
        if (isEmailExist) {
            return next(new ErrorHandler_1.default("Email already exists", 400));
        }
        // Create the admin user object
        const adminUser = new user_model_1.default({
            name,
            email,
            password,
            role: "admin", // Set the role as "admin"
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
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
const createActivationToken = (user) => {
    const activationCode = Math.floor(100 + Math.random() * 9000).toString();
    const token = jsonwebtoken_1.default.sign({
        user,
        activationCode,
    }, process.env.ACTIVATION_SECRET, {
        expiresIn: "5m",
    });
    return { token, activationCode };
};
exports.createActivationToken = createActivationToken;
exports.activateUser = (0, catchAsyncErros_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { activation_token, activation_code } = req.body;
        const newUser = jsonwebtoken_1.default.verify(activation_token, process.env.ACTIVATION_SECRET);
        if (newUser.activationCode !== activation_code) {
            return next(new ErrorHandler_1.default("Invalid activation code", 400));
        }
        const { name, email, password } = newUser.user;
        const existUser = await user_model_1.default.findOne({ email });
        if (existUser) {
            return next(new ErrorHandler_1.default("Email already exist", 400));
        }
        const user = await user_model_1.default.create({
            name,
            email,
            password,
        });
        res.status(201).json({
            success: true,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
exports.loginUser = (0, catchAsyncErros_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(new ErrorHandler_1.default("Please enter email and password", 400));
        }
        const user = await user_model_1.default.findOne({ email }).select("+password");
        if (!user) {
            return next(new ErrorHandler_1.default("Invalid email or password", 400));
        }
        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            return next(new ErrorHandler_1.default("Invalid email or password", 400));
        }
        (0, jwt_1.sendToken)(user, 200, res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// logout user
exports.logoutUser = (0, catchAsyncErros_1.catchAsyncError)(async (req, res, next) => {
    try {
        res.cookie("access_token", "", { maxAge: 1 });
        res.cookie("refresh_token", "", { maxAge: 1 });
        const userId = req.user?._id || "";
        redis_1.redis.del(userId);
        res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// update access token
exports.updateAccessToken = (0, catchAsyncErros_1.catchAsyncError)(async (req, res, next) => {
    try {
        // const refresh_token =req.headers["refresh-token"]  as string;
        // console.log("Request headers:", req.headers);
        const refresh_token = req.cookies.refresh_token;
        console.log("Received refresh token from cookies:", refresh_token);
        if (!refresh_token) {
            return next(new ErrorHandler_1.default("Refresh token must be provided", 400));
        }
        const decoded = jsonwebtoken_1.default.verify(refresh_token, process.env.REFRESH_TOKEN);
        const message = "Could not refresh token";
        if (!decoded) {
            return next(new ErrorHandler_1.default(message, 400));
        }
        const session = await redis_1.redis.get(decoded.id);
        if (!session) {
            return next(new ErrorHandler_1.default("Please login to access this resources!", 400));
        }
        const user = JSON.parse(session);
        const accessToken = jsonwebtoken_1.default.sign({ id: user._id }, process.env.ACCESS_TOKEN, {
            expiresIn: "10m",
        });
        const refreshToken = jsonwebtoken_1.default.sign({ id: user._id }, process.env.REFRESH_TOKEN, {
            expiresIn: "3d",
        });
        req.user = user;
        res.cookie("access_token", accessToken, jwt_1.accessTokenOptions);
        res.cookie("refresh_token", refreshToken, jwt_1.refreshTokenOptions);
        await redis_1.redis.set(user._id, JSON.stringify(user), "EX", 604800); //expire after 7 days(604800 seconds) 
        res.status(200).json({
            status: "success",
            accessToken,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// GET USER INFO
exports.getUserInfo = (0, catchAsyncErros_1.catchAsyncError)(async (req, res, next) => {
    try {
        const userId = req.user?._id;
        (0, user_service_1.getUserById)(userId, res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
exports.socialAuth = (0, catchAsyncErros_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { email, name, avatar } = req.body;
        // const { email, name, password } = req.body as ISocialAuthBody;
        const user = await user_model_1.default.findOne({ email });
        if (!user) {
            const newUser = await user_model_1.default.create({ email, name, avatar });
            // const newUser = await userModel.create({ email, name, password });
            (0, jwt_1.sendToken)(newUser, 200, res);
        }
        else {
            (0, jwt_1.sendToken)(user, 200, res);
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
exports.updateUserInfo = (0, catchAsyncErros_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { name, email, courses } = req.body;
        const userId = req.user?._id;
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            return next(new ErrorHandler_1.default('User not found', 404));
        }
        if (name) {
            user.name = name;
        }
        if (courses) {
            const existingCourseIndex = user.courses.findIndex((c) => c.courseId === courses.courseId);
            if (existingCourseIndex > -1) {
                // Update existing course
                user.courses[existingCourseIndex] = courses;
            }
            else {
                // Add new course
                user.courses.push(courses);
            }
        }
        await user.save();
        await redis_1.redis.set(userId, JSON.stringify(user));
        res.status(201).json({
            success: true,
            user,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
exports.updateUserPassword = (0, catchAsyncErros_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return next(new ErrorHandler_1.default("Please enter old password and new password", 404));
        }
        const user = await user_model_1.default.findById(req.user?._id).select("+password");
        if (user?.password == undefined) {
            return next(new ErrorHandler_1.default("Invalid User", 404));
        }
        const isPasswordMatch = await user?.comparePassword(oldPassword);
        if (!isPasswordMatch) {
            return next(new ErrorHandler_1.default("Invalid old password", 404));
        }
        user.password = newPassword;
        await user.save();
        res.status(201).json({
            success: true,
            user,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// sign in as admin
const addUserAsAdmin = async (req, res, next) => {
    try {
        const { name, email, password, role, profile_picture } = req.body; // Added avatar
        // Check if email already exists
        const isEmailExist = await user_model_1.default.findOne({ email });
        if (isEmailExist) {
            return next(new ErrorHandler_1.default("Email already exists", 400));
        }
        // Hash the password
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        // Create a new user
        const newUser = new user_model_1.default({
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
            const myCloud = await cloudinary_1.default.v2.uploader.upload(profile_picture, {
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
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error, 500));
    }
};
exports.addUserAsAdmin = addUserAsAdmin;
exports.updateProfilePicture = (0, catchAsyncErros_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { avatar } = req.body; // Expect avatar to be a base64-encoded string
        if (!avatar) {
            return next(new ErrorHandler_1.default("No profile picture uploaded", 404));
        }
        const userId = req.user?._id;
        const user = await user_model_1.default.findById(userId);
        if (avatar && user) {
            // If user has an existing avatar, delete it
            if (user?.avatar?.public_id) {
                await cloudinary_1.default.v2.uploader.destroy(user?.avatar?.public_id);
            }
            console.log("avatar deleted");
            // Upload the new avatar
            const myCloud = await cloudinary_1.default.v2.uploader.upload(avatar, {
                folder: "avatars",
                width: 150,
            });
            user.avatar = {
                public_id: myCloud.public_id,
                url: myCloud.url,
            };
            console.log("avatar uploaded");
            await user.save();
            await redis_1.redis.set(userId, JSON.stringify(user));
            return res.status(200).json({
                success: true,
                user,
            });
        }
        return next(new ErrorHandler_1.default("User not found", 404));
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// get all users
exports.getAllUsers = (0, catchAsyncErros_1.catchAsyncError)(async (req, res, next) => {
    try {
        (0, user_service_1.getAllUsersService)(res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// update user role by admin
exports.updateUserRole = (0, catchAsyncErros_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { email, role } = req.body;
        (0, user_service_1.updateUserRoleService)(res, email, role);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// delete user
exports.deleteUser = (0, catchAsyncErros_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await user_model_1.default.findById(id);
        if (!user) {
            return next(new ErrorHandler_1.default("User not found", 404));
        }
        await user.deleteOne({ id });
        await redis_1.redis.del(id);
        res.status(201).json({
            success: true,
            message: "User deleted successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
exports.updateUserProfilePicture = (0, catchAsyncErros_1.catchAsyncError)(async (req, res, next) => {
    console.log(req.files);
    try {
        const userId = req.user?._id;
        console.log(req.files); // Check the content of req.files
        const file = req.files?.profile_picture;
        if (!userId) {
            return next(new ErrorHandler_1.default("User ID is required", 400));
        }
        if (!file) {
            return next(new ErrorHandler_1.default("No profile picture uploaded", 400));
        }
        // Handle image update
        const base64Data = await ImageToBase64(file.path);
        const profilePictureUrl = `data:${file.type};base64,${base64Data}`;
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            return next(new ErrorHandler_1.default("User not found", 404));
        }
        // If user has an existing profile picture, delete it
        if (user.profile_picture) {
            // Assuming you want to delete the old image from Cloudinary
            // Adjust the deletion logic if you're storing the URL directly
            const oldImagePublicId = user.profile_picture.split('/').pop()?.split('.')[0]; // Extract public_id from URL
            if (oldImagePublicId) {
                await cloudinary_1.default.v2.uploader.destroy(oldImagePublicId);
            }
        }
        // Upload the new profile picture
        const uploadedPicture = await cloudinary_1.default.v2.uploader.upload(profilePictureUrl, {
            folder: "profile_pictures",
            width: 150,
            crop: "scale"
        });
        user.profile_picture = uploadedPicture.secure_url;
        await user.save();
        await redis_1.redis.set(userId, JSON.stringify(user));
        res.status(200).json({
            success: true,
            message: "Profile picture updated successfully",
            user,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
