"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const error_1 = require("./middleware/error");
const user_route_1 = __importDefault(require("./routes/user.route"));
const course_route_1 = __importDefault(require("./routes/course.route"));
const order_route_1 = __importDefault(require("./routes/order.route"));
const notification_route_1 = __importDefault(require("./routes/notification.route"));
const analytics_route_1 = __importDefault(require("./routes/analytics.route"));
const layout_route_1 = __importDefault(require("./routes/layout.route"));
const NewsCategory_route_1 = __importDefault(require("./routes/NewsCategory.route"));
const news_route_1 = __importDefault(require("./routes/news.route"));
const express_form_data_1 = __importDefault(require("express-form-data"));
const express_rate_limit_1 = require("express-rate-limit");
exports.app = (0, express_1.default)();
require("dotenv").config();
// body parser
exports.app.use(express_1.default.json({ limit: "50mb" }));
// cookie parser
exports.app.use((0, cookie_parser_1.default)());
exports.app.use(express_form_data_1.default.parse());
// cors cross-origin resource sharing
exports.app.use((0, cors_1.default)({
    origin: 'https://cgkhabaradminnew.vercel.app', // allow requests from this origin
    methods: 'GET,POST,PUT,DELETE', // specify allowed HTTP methods
    credentials: true // include credentials if needed (for cookies/auth)
}));
// rate limiter
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
});
// Apply the rate limiting middleware to all requests **before the routes**
exports.app.use(limiter);
// routes
exports.app.use("/api/v1", user_route_1.default);
exports.app.use("/api/v1", course_route_1.default);
exports.app.use("/api/v1", order_route_1.default);
exports.app.use("/api/v1", notification_route_1.default);
exports.app.use("/api/v1", analytics_route_1.default);
exports.app.use("/api/v1", layout_route_1.default);
exports.app.use("/api/v1", NewsCategory_route_1.default);
exports.app.use("/api/v1", news_route_1.default);
// testing our api
exports.app.get("/test", (req, res, next) => {
    res.status(200).json({
        success: true,
        message: "API is working",
    });
});
// unknown route handler
exports.app.all("*", (req, res, next) => {
    const err = new Error(`Route ${req.originalUrl} not found`);
    err.statusCode = 404;
    next(err);
});
// error handling middleware
exports.app.use(error_1.ErrorMiddleware);
