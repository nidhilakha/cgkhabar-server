"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllOrders = exports.createOrder = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const course_model_1 = __importDefault(require("../models/course.model"));
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const catchAsyncErros_1 = require("../middleware/catchAsyncErros");
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const order_service_1 = require("../services/order.service");
const notification_model_1 = __importDefault(require("../models/notification.model"));
// create order
exports.createOrder = (0, catchAsyncErros_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { courseId, payment_info } = req.body;
        const user = await user_model_1.default.findById(req.user?._id);
        if (!user) {
            return next(new ErrorHandler_1.default("Invalid user id", 404));
        }
        // Check if the course is already in the user's courses
        const courseExistInUser = user.courses.some((course) => course.courseId === courseId);
        if (courseExistInUser) {
            return next(new ErrorHandler_1.default("You have already purchased this course", 404));
        }
        const course = await course_model_1.default.findById(courseId);
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found", 404));
        }
        const data = {
            courseId: course._id,
            userId: user._id,
            payment_info,
        };
        const mailData = {
            order: {
                _id: course._id.toString().slice(0, 6),
                name: course.name,
                price: course.price,
                date: new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }),
            },
        };
        const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/order-confirmation.ejs"), { order: mailData });
        try {
            if (user) {
                await (0, sendMail_1.default)({
                    email: user.email,
                    subject: "Order Confirmation",
                    template: "order-confirmation.ejs",
                    data: mailData,
                });
            }
        }
        catch (error) {
            return next(new ErrorHandler_1.default(error.message, 400));
        }
        // Ensure the correct structure based on schema
        user.courses.push({ courseId: course._id.toString() });
        await user.save(); // Save the updated user document
        await notification_model_1.default.create({
            user: user._id,
            title: "New Order",
            message: `You have a new order from ${course.name}`,
        });
        course.purchased ? course.purchased += 1 : course.purchased;
        await course.save();
        (0, order_service_1.newOrder)(data, res, next);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// get all order only for admin
exports.getAllOrders = (0, catchAsyncErros_1.catchAsyncError)(async (req, res, next) => {
    try {
        await (0, order_service_1.getAllOrdersService)(res);
    }
    catch (error) {
        next(new ErrorHandler_1.default(error.message, 400));
    }
});
