"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserRoleService = exports.getAllUsersService = exports.getUserById = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const redis_1 = require("../utils/redis");
// get user by id
const getUserById = async (id, res) => {
    // const user=await userModel.findById(id);
    const userJSON = await redis_1.redis.get(id);
    if (userJSON) {
        const user = JSON.parse(userJSON);
        res.status(201).json({
            success: true,
            user,
        });
    }
};
exports.getUserById = getUserById;
// get all users
const getAllUsersService = async (res) => {
    // const user=await userModel.findById(id);
    const users = await user_model_1.default.find().sort({ createdAt: -1 });
    res.status(201).json({
        success: true,
        users,
    });
};
exports.getAllUsersService = getAllUsersService;
// update user role
const updateUserRoleService = async (res, email, role) => {
    try {
        // Update the user's role based on the email
        const user = await user_model_1.default.findOneAndUpdate({ email }, // Filter criteria
        { role }, // Update object
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
    }
    catch (error) {
        // Handle unexpected errors
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.updateUserRoleService = updateUserRoleService;
