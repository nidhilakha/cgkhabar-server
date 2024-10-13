import cookieParser from "cookie-parser";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { ErrorMiddleware } from "./middleware/error";
import userRouter from "./routes/user.route";
import courseRouter from "./routes/course.route";
import orderRouter from "./routes/order.route";
import notificationRouter from "./routes/notification.route";
import analyticsRouter from "./routes/analytics.route";
import layoutRouter from "./routes/layout.route";
import categoryRouter from "./routes/NewsCategory.route";
import newsRouter from "./routes/news.route";
import formData from 'express-form-data';
import { rateLimit } from 'express-rate-limit'


export const app = express();
require("dotenv").config();

// body parser
app.use(express.json({ limit: "50mb" }));

// cookie parser
app.use(cookieParser());
app.use(formData.parse());
// cors cross origin resource sharing

app.use(
  cors({
    // origin: process.env.ORIGIN,
    origin: [
      'https://cgkhabaradminnew.vercel.app/',
    ],

    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
  })
);


const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	// store: ... , // Redis, Memcached, etc. See below.
})

// Apply the rate limiting middleware to all requests.
// routes
app.use("/api/v1", userRouter);
app.use("/api/v1", courseRouter);
app.use("/api/v1", orderRouter);
app.use("/api/v1", notificationRouter);

app.use("/api/v1", analyticsRouter);
app.use("/api/v1", layoutRouter);
app.use("/api/v1", categoryRouter);
app.use("/api/v1", newsRouter);



// testing our api

app.get("/test", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    success: true,
    message: "API is working",
  });
});

// unknown route
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Route ${req.originalUrl} not found`) as any;
  err.statusCode = 404;
  next(err);
});
app.use(limiter)

app.use(ErrorMiddleware);
