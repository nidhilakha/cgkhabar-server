"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllOrdersService = exports.newOrder = void 0;
const order_model_1 = __importDefault(require("../models/order.model"));
// get user by id
const newOrder = async (data, res, next) => {
    const order = await order_model_1.default.create(data);
    res.status(201).json({
        success: true,
        order,
    });
};
exports.newOrder = newOrder;
// get all orders sort by desc
const getAllOrdersService = async (res) => {
    try {
        const orders = await order_model_1.default.find().sort({ createdAt: -1 });
        res.status(201).json({
            success: true,
            orders,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.getAllOrdersService = getAllOrdersService;
