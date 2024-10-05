import { Request, Response, NextFunction } from "express";
import { catchAsyncError } from "../middleware/catchAsyncErros";
import NewsModel from "../models/news.model";
import ErrorHandler from "../utils/ErrorHandler";
import path from 'path';

import cloudinary from "cloudinary";
import mongoose from 'mongoose';

import UserModel from '../models/user.model'; // Adjust the import path as needed
import { IComment } from '../models/news.model'; // Adjust path as necessary

// import multer from "multer";
// import { CloudinaryStorage } from "multer-storage-cloudinary";
// import { v2 as cloudinary } from 'cloudinary';
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





// Create news
export const createNews = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Log request body and files
      console.log(req.body);
      const data = req.body;
      console.log(req.files);

      // Check if the featured image is uploaded or selected from the media library
      const file = req.files?.featured_image as FeaturedImageFile | undefined;
      const mediaImageUrl = req.body.featured_image_url; // Assuming the media library provides a URL

      const video = req.files?.featured_video as FeaturedImageFile | undefined;

      // Log the file and mediaImageUrl for debugging
      console.log({ file, mediaImageUrl, video });

      // Upload video to Cloudinary (if present)
      let videoUrl: string | undefined;
      if (video) {
        try {
          const uploadedVideo = await cloudinary.v2.uploader.upload(video.path, {
            folder: "courses",
            resource_type: "video",
          });
          videoUrl = uploadedVideo.secure_url;
        } catch (error) {
          return next(new ErrorHandler("Failed to upload video", 500));
        }
      }

      // Handle featured image from either file upload or media library
      let fileUrl: string | undefined;
      if (file) {
        try {
          const uploadedFile = await cloudinary.v2.uploader.upload(file.path, {
            folder: "news",
            resource_type: "image",
          });
          fileUrl = uploadedFile.secure_url;
        } catch (error) {
          return next(new ErrorHandler("Failed to upload image", 500));
        }
      } else if (mediaImageUrl) {
        // Use the image URL selected from the media library
        fileUrl = mediaImageUrl;
      }

      const { title, content, likes = 0, category, comments, banner, author, yt_url,reel_url } = req.body;

      // Validate required fields
      if (!title || !content || !category) {
        return next(new ErrorHandler("Title, content, and category are required", 400));
      }

      // Validate comments structure if provided
      if (comments) {
        comments.forEach((comment: any) => {
          if (!comment.user || !comment.user._id || !comment.user.name || !comment.content) {
            return next(
              new ErrorHandler("Each comment must include a user ID, user name, and content", 400)
            );
          }

          if (comment.replies) {
            comment.replies.forEach((reply: any) => {
              if (!reply.user || !reply.user._id || !reply.user.name || !reply.content) {
                return next(new ErrorHandler("Each reply must include a user ID, user name, and content", 400));
              }
            });
          }
        });
      }

      // Create new news item
      const newNews = await NewsModel.create({
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
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);


// Update news
export const updateNews = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { title, content, likes, category, comments, banner, author,yt_url,reel_url,featured_image_url } = req.body;
console.log(featured_image_url);
      // Handle files if provided
      const file = req.files?.featured_image as unknown as FeaturedImageFile;
      const video = req.files?.featured_video as unknown as FeaturedImageFile;
      const mediaImageUrl = req.body.featured_image_url; // Assuming the media library provides a URL

      // Prepare update fields
      const updateFields: any = { title, content, likes, category,banner,author,yt_url,reel_url };

      if (comments) {
        updateFields.comments = comments;
      }

      // Handle image update
      if (file) {
        const base64Data = await ImageToBase64(file.path);
        updateFields.featured_image = `data:${file.type};base64,${base64Data}`;
      }

      // Handle video update
      let videoUrl: string | undefined;
      if (video) {
        const uploadedVideo = await cloudinary.v2.uploader.upload(video.path, {
          folder: "courses",
          resource_type: "video"
        });
        videoUrl = uploadedVideo.secure_url;
        updateFields.featured_video = videoUrl;
      }

      let fileUrl: string | undefined;
      if (file) {
        try {
          const uploadedFile = await cloudinary.v2.uploader.upload(file.path, {
            folder: "news",
            resource_type: "image"
          });
          fileUrl = uploadedFile.secure_url;
          updateFields.featured_image = fileUrl;
        } catch (error) {
          return next(new ErrorHandler("Failed to upload image", 500));
        }
      } else if (mediaImageUrl) {
        // Use the image URL selected from the media library
        fileUrl = mediaImageUrl;
        updateFields.featured_image = fileUrl;

      }

   

      const updatedNews = await NewsModel.findByIdAndUpdate(
        id,
        updateFields,
        { new: true, runValidators: true }
      );

      if (!updatedNews) {
        return next(new ErrorHandler("News article not found", 404));
      }

      res.status(200).json({
        success: true,
        message: "News article updated successfully",
        news: updatedNews,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

  
  

//   get news by id
export const getNewsById = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const news = await NewsModel.findById(id)
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
        return next(new ErrorHandler("News article not found", 404));
      }

      res.status(200).json({
        success: true,
        news,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

  
//   delete news
export const deleteNews = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
  
        const deletedNews = await NewsModel.findByIdAndDelete(id);
  
        if (!deletedNews) {
          return next(new ErrorHandler("News article not found", 404));
        }
  
        res.status(200).json({
          success: true,
          message: "News article deleted successfully",
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
  );

  
//   get  all news
export const getAllNews = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Fetch all news articles, optionally populate the category field
        const newsArticles = await NewsModel.find().populate("category");
  
        res.status(200).json({
          success: true,
          news: newsArticles,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
  );
  

//   last 10 added news
// Get last 10 news articles
export const getSomeNews = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Fetch last 10 news articles, sorted by creation date in descending order
        const newsArticles = await NewsModel.find()
          .sort({ createdAt: -1 }) // Sort by creation date in descending order
          .limit(10) // Limit the number of results to 10
          .populate("category");
  
        res.status(200).json({
          success: true,
          news: newsArticles,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
  );
  
//get banner
  export const getNewsWithBanner = async (req: Request, res: Response) => {
    try {
      // Find all news items where banner is 1
      const newsWithBanner = await NewsModel.find({ banner: 1 }); // Use number 1 instead of string '1'
    
      // Return the result as JSON
      res.json({ success: true, news: newsWithBanner });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };


  export const getNewsWithShorts = async (req: Request, res: Response) => {
    try {
      // Query to find news where reel_url exists and is not an empty string
      const newsWithShorts = await NewsModel.find({
        reel_url: { $exists: true, $ne: "" }
      });
  
      // Log the results to confirm data is retrieved correctly
      console.log('News with shorts retrieved:', newsWithShorts);
  
      // Send response in an object format for easier client-side handling
      res.status(200).json({ news: newsWithShorts });
    } catch (error) {
      console.error('Error retrieving news with shorts:', error);
      res.status(500).json({ message: 'Error retrieving news with shorts', error });
    }
  };
  // delete banner status
  export const updateNewsBanner = async (req: Request, res: Response) => {
    console.log("hello");
    const { id } = req.params;
    const { banner } = req.body; // Ensure the banner is coming from the body
  
    console.log("Updating banner for news ID:", id);
    console.log("Request body:", req.body);
    try {

      // Find the news item by ID and update the banner field to 0
      const updatedNews = await NewsModel.findByIdAndUpdate(
        id,
        { banner: 0 },
        { new: true, runValidators: true }
      );
  
      if (!updatedNews) {
        return res.status(404).json({ success: false, message: 'News item not found' });
      }
  
      // Return the updated news item
      res.json({ success: true, news: updatedNews });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };


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
export const getLatestNewsByCategory = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { categoryId } = req.params;

      // Validate if categoryId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return next(new ErrorHandler("Invalid category ID", 400));
      }

      // Fetch the 5 latest news by category
      const latestNews = await NewsModel.find({ category: categoryId })
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
        return next(new ErrorHandler("No news articles found for this category", 404));
      }

      res.status(200).json({
        success: true,
        latestNews,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
