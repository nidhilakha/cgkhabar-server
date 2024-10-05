"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNotification = exports.getNotification = void 0;
const notification_model_1 = __importDefault(require("../models/notification.model"));
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const catchAsyncErros_1 = require("../middleware/catchAsyncErros");
const node_cron_1 = __importDefault(require("node-cron"));
// push new notification on top ie sorting
exports.getNotification = (0, catchAsyncErros_1.catchAsyncError)(async (req, res, next) => {
    try {
        const notifications = await notification_model_1.default.find().sort({ createdAt: -1 });
        res.status(201).json({
            success: true,
            notifications,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
//   upodate notification status
exports.updateNotification = (0, catchAsyncErros_1.catchAsyncError)(async (req, res, next) => {
    try {
        const notifications = await notification_model_1.default.findById(req.params.id);
        if (!notifications) {
            return next(new ErrorHandler_1.default("Notification not found", 400));
        }
        else {
            notifications.status ? notifications.status = 'read' : notifications.status;
        }
        await notifications.save();
        const notification = await notification_model_1.default.find().sort({ createdAt: -1 });
        res.status(201).json({
            success: true,
            notifications,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
//  delete notification----------only admin
node_cron_1.default.schedule("0 0 0 * * *", async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 2);
    await notification_model_1.default.deleteMany({ status: "read", createdAt: { $lt: thirtyDaysAgo } });
    console.log('Deleted read notifications');
});
