"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLatestNewsByCategory = exports.updateNewsBanner = exports.getNewsWithShorts = exports.getNewsWithBanner = exports.getSomeNews = exports.getAllNews = exports.deleteNews = exports.getNewsById = exports.updateNews = exports.createNews = void 0;
const catchAsyncErros_1 = require("../middleware/catchAsyncErros");
const news_model_1 = __importDefault(require("../models/news.model"));
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const mongoose_1 = __importDefault(require("mongoose"));
// import multer from "multer";
// import { CloudinaryStorage } from "multer-storage-cloudinary";
// import { v2 as cloudinary } from 'cloudinary';
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const ImageToBase64 = require('image-to-base64');
// Create news
exports.createNews = (0, catchAsyncErros_1.catchAsyncError)(async (req, res, next) => {
    try {
        // Log request body and files
        console.log(req.body);
        const data = req.body;
        console.log(req.files);
        // Check if the featured image is uploaded or selected from the media library
        const file = req.files?.featured_image;
        const mediaImageUrl = req.body.featured_image_url; // Assuming the media library provides a URL
        const video = req.files?.featured_video;
        // Log the file and mediaImageUrl for debugging
        console.log({ file, mediaImageUrl, video });
        // Upload video to Cloudinary (if present)
        let videoUrl;
        if (video) {
            try {
                const uploadedVideo = await cloudinary_1.default.v2.uploader.upload(video.path, {
                    folder: "courses",
                    resource_type: "video",
                });
                videoUrl = uploadedVideo.secure_url;
            }
            catch (error) {
                return next(new ErrorHandler_1.default("Failed to upload video", 500));
            }
        }
        // Handle featured image from either file upload or media library
        let fileUrl;
        if (file) {
            try {
                const uploadedFile = await cloudinary_1.default.v2.uploader.upload(file.path, {
                    folder: "news",
                    resource_type: "image",
                });
                fileUrl = uploadedFile.secure_url;
            }
            catch (error) {
                return next(new ErrorHandler_1.default("Failed to upload image", 500));
            }
        }
        else if (mediaImageUrl) {
            // Use the image URL selected from the media library
            fileUrl = mediaImageUrl;
        }
        const { title, content, likes = 0, category, comments, banner, author, yt_url, reel_url } = req.body;
        // Validate required fields
        if (!title || !content || !category) {
            return next(new ErrorHandler_1.default("Title, content, and category are required", 400));
        }
        // Validate comments structure if provided
        if (comments) {
            comments.forEach((comment) => {
                if (!comment.user || !comment.user._id || !comment.user.name || !comment.content) {
                    return next(new ErrorHandler_1.default("Each comment must include a user ID, user name, and content", 400));
                }
                if (comment.replies) {
                    comment.replies.forEach((reply) => {
                        if (!reply.user || !reply.user._id || !reply.user.name || !reply.content) {
                            return next(new ErrorHandler_1.default("Each reply must include a user ID, user name, and content", 400));
                        }
                    });
                }
            });
        }
        // Create new news item
        const newNews = await news_model_1.default.create({
            title,
            content,
            likes,
            category,
            comments,
            banner,
            author,
            yt_url,
            reel_url,
            featured_video: videoUrl,
            featured_image: fileUrl, // This could be either the uploaded image or the selected media URL
        });
        res.status(201).json({
            success: true,
            message: "News article created successfully",
            news: newNews,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// Update news
exports.updateNews = (0, catchAsyncErros_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, content, likes, category, comments, banner, author, yt_url, reel_url, featured_image_url } = req.body;
        console.log(featured_image_url);
        // Handle files if provided
        const file = req.files?.featured_image;
        const video = req.files?.featured_video;
        const mediaImageUrl = req.body.featured_image_url; // Assuming the media library provides a URL
        // Prepare update fields
        const updateFields = { title, content, likes, category, banner, author, yt_url, reel_url };
        if (comments) {
            updateFields.comments = comments;
        }
        // Handle image update
        if (file) {
            const base64Data = await ImageToBase64(file.path);
            updateFields.featured_image = `data:${file.type};base64,${base64Data}`;
        }
        // Handle video update
        let videoUrl;
        if (video) {
            const uploadedVideo = await cloudinary_1.default.v2.uploader.upload(video.path, {
                folder: "courses",
                resource_type: "video"
            });
            videoUrl = uploadedVideo.secure_url;
            updateFields.featured_video = videoUrl;
        }
        let fileUrl;
        if (file) {
            try {
                const uploadedFile = await cloudinary_1.default.v2.uploader.upload(file.path, {
                    folder: "news",
                    resource_type: "image"
                });
                fileUrl = uploadedFile.secure_url;
                updateFields.featured_image = fileUrl;
            }
            catch (error) {
                return next(new ErrorHandler_1.default("Failed to upload image", 500));
            }
        }
        else if (mediaImageUrl) {
            // Use the image URL selected from the media library
            fileUrl = mediaImageUrl;
            updateFields.featured_image = fileUrl;
        }
        const updatedNews = await news_model_1.default.findByIdAndUpdate(id, updateFields, { new: true, runValidators: true });
        if (!updatedNews) {
            return next(new ErrorHandler_1.default("News article not found", 404));
        }
        res.status(200).json({
            success: true,
            message: "News article updated successfully",
            news: updatedNews,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
//   get news by id
exports.getNewsById = (0, catchAsyncErros_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { id } = req.params;
        const news = await news_model_1.default.findById(id)
            .populate("category")
            .populate({
            path: "comments.user",
            select: "name", // Select only the `name` field
        })
            .populate({
            path: "comments.replies.user",
            select: "name", // Select only the `name` field
        });
        if (!news) {
            return next(new ErrorHandler_1.default("News article not found", 404));
        }
        res.status(200).json({
            success: true,
            news,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
//   delete news
exports.deleteNews = (0, catchAsyncErros_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { id } = req.params;
        const deletedNews = await news_model_1.default.findByIdAndDelete(id);
        if (!deletedNews) {
            return next(new ErrorHandler_1.default("News article not found", 404));
        }
        res.status(200).json({
            success: true,
            message: "News article deleted successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
//   get  all news
exports.getAllNews = (0, catchAsyncErros_1.catchAsyncError)(async (req, res, next) => {
    try {
        // Fetch all news articles, optionally populate the category field
        const newsArticles = await news_model_1.default.find().populate("category");
        res.status(200).json({
            success: true,
            news: newsArticles,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
//   last 10 added news
// Get last 10 news articles
exports.getSomeNews = (0, catchAsyncErros_1.catchAsyncError)(async (req, res, next) => {
    try {
        // Fetch last 10 news articles, sorted by creation date in descending order
        const newsArticles = await news_model_1.default.find()
            .sort({ createdAt: -1 }) // Sort by creation date in descending order
            .limit(10) // Limit the number of results to 10
            .populate("category");
        res.status(200).json({
            success: true,
            news: newsArticles,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
//get banner
const getNewsWithBanner = async (req, res) => {
    try {
        // Find all news items where banner is 1
        const newsWithBanner = await news_model_1.default.find({ banner: 1 }); // Use number 1 instead of string '1'
        // Return the result as JSON
        res.json({ success: true, news: newsWithBanner });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getNewsWithBanner = getNewsWithBanner;
const getNewsWithShorts = async (req, res) => {
    try {
        // Query to find news where reel_url exists and is not an empty string
        const newsWithShorts = await news_model_1.default.find({
            reel_url: { $exists: true, $ne: "" }
        });
        // Log the results to confirm data is retrieved correctly
        console.log('News with shorts retrieved:', newsWithShorts);
        // Send response in an object format for easier client-side handling
        res.status(200).json({ news: newsWithShorts });
    }
    catch (error) {
        console.error('Error retrieving news with shorts:', error);
        res.status(500).json({ message: 'Error retrieving news with shorts', error });
    }
};
exports.getNewsWithShorts = getNewsWithShorts;
// delete banner status
const updateNewsBanner = async (req, res) => {
    console.log("hello");
    const { id } = req.params;
    const { banner } = req.body; // Ensure the banner is coming from the body
    console.log("Updating banner for news ID:", id);
    console.log("Request body:", req.body);
    try {
        // Find the news item by ID and update the banner field to 0
        const updatedNews = await news_model_1.default.findByIdAndUpdate(id, { banner: 0 }, { new: true, runValidators: true });
        if (!updatedNews) {
            return res.status(404).json({ success: false, message: 'News item not found' });
        }
        // Return the updated news item
        res.json({ success: true, news: updatedNews });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.updateNewsBanner = updateNewsBanner;
// // add comments
// export const addComment = async (req: Request, res: Response) => {
//   const { id } = req.params; // News item ID
//   const { content } = req.body; // Comment content
//   if (!req.user || !req.user._id) {
//     return res.status(401).json({ success: false, message: 'User not authenticated' });
//   }
//   try {
//     // Ensure `id` is a valid ObjectId
//     const newsId = new mongoose.Types.ObjectId(id);
//     // Find the news item by ID
//     const news = await NewsModel.findById(newsId);
//     if (!news) {
//       return res.status(404).json({ success: false, message: 'News item not found' });
//     }
//     // Create a new comment
//     const newComment: IComment = {
//       user: new mongoose.Types.ObjectId(req.user._id as string), // Ensure user is an ObjectId
//       content:new String,
//       createdAt: new Date(),
//       replies: [] // Initialize replies as an empty array
//     };
//     // Add the new comment to the news item's comments array
//     news.comments.push(newComment);
//     // Save the updated news item
//     const updatedNews = await news.save();
//     res.json({ success: true, news: updatedNews });
//   } catch (error) {
//     console.error('Error adding comment:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// };
// // Add Reply Method
// export const addReply = async (req: Request, res: Response) => {
//   const { newsId, commentId } = req.params; // News item ID and comment ID
//   const { content } = req.body; // Reply content
//   if (!req.user || !req.user._id) {
//     return res.status(401).json({ success: false, message: 'User not authenticated' });
//   }
//   try {
//     // Ensure `newsId` and `commentId` are valid ObjectIds
//     const newsObjectId = new mongoose.Types.ObjectId(newsId);
//     const commentObjectId = new mongoose.Types.ObjectId(commentId);
//     // Find the news item by ID
//     const news = await NewsModel.findById(newsObjectId);
//     if (!news) {
//       return res.status(404).json({ success: false, message: 'News item not found' });
//     }
//     // Find the comment by ID
//     const comment = news.comments.id(commentObjectId);
//     if (!comment) {
//       return res.status(404).json({ success: false, message: 'Comment not found' });
//     }
//     // Create a new reply
//     const newReply = {
//       user: new mongoose.Types.ObjectId(req.user._id as string), // Ensure user is an ObjectId
//       content,
//       createdAt: new Date(),
//     };
//     // Add the new reply to the comment's replies array
//     comment.replies.push(newReply);
//     // Save the updated news item
//     const updatedNews = await news.save();
//     res.json({ success: true, news: updatedNews });
//   } catch (error) {
//     console.error('Error adding reply:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// };
// get news by category
// Get the 5 latest news by category
exports.getLatestNewsByCategory = (0, catchAsyncErros_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { categoryId } = req.params;
        // Validate if categoryId is a valid ObjectId
        if (!mongoose_1.default.Types.ObjectId.isValid(categoryId)) {
            return next(new ErrorHandler_1.default("Invalid category ID", 400));
        }
        // Fetch the 5 latest news by category
        const latestNews = await news_model_1.default.find({ category: categoryId })
            .sort({ createdAt: -1 }) // Sort by latest created news
            .limit(5) // Limit the results to 5
            .populate("category") // Populate category details
            .populate({
            path: "comments.user",
            select: "name", // Select only the name field of the user in comments
        })
            .populate({
            path: "comments.replies.user",
            select: "name", // Select only the name field of the user in replies
        });
        if (latestNews.length === 0) {
            return next(new ErrorHandler_1.default("No news articles found for this category", 404));
        }
        res.status(200).json({
            success: true,
            latestNews,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
