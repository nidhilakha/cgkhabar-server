import { Request, Response, NextFunction } from "express";
require("dotenv").config();
import courseModel from "../models/course.model";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsyncError } from "../middleware/catchAsyncErros";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";

import ejs from "ejs";
import path from "path";

import { redis } from "../utils/redis";
import cloudinary from "cloudinary";
import { createCourse, getAllCoursesService } from "../services/course.service";
import mongoose from "mongoose";
import sendMail from "../utils/sendMail";
import notificationModel from "../models/notification.model";
import axios from 'axios';

// upload course
export const uploadCourse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      console.log(data);
      const thumbnail = data.thumbnail;
      if (thumbnail) {
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      createCourse(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// edit course
export const editCourse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;

      if (thumbnail) {
        // Check if thumbnail is an object with public_id and url properties
        if (typeof thumbnail === 'object' && thumbnail.public_id && thumbnail.url) {
          // Destroy the old image using the public_id
          await cloudinary.v2.uploader.destroy(thumbnail.public_id);

          // Upload the new image (assuming thumbnail.url is the image URL)
          const myCloud = await cloudinary.v2.uploader.upload(thumbnail.url, {
            folder: "courses",
          });

          // Update data with new thumbnail info
          data.thumbnail = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          };
        } else {
          // Handle case where thumbnail is not in the expected format
          return next(new ErrorHandler("Invalid thumbnail data", 400));
        }
      }

      const courseId = req.params.id;
      const course = await courseModel.findByIdAndUpdate(
        courseId,
        { $set: data },
        { new: true }
      );

      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
// get single course-------without purchasing
export const getSingleCourse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const isCacheExist = await redis.get(courseId);
      console.log("hitting redis");

      if (isCacheExist) {
        const course = JSON.parse(isCacheExist);
        res.status(200).json({
          success: true,
          course,
        });
      } else {
        const course = await courseModel
          .findById(req.params.id)
          .select(
            "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
          );
        console.log("hitting mmongodb");
        await redis.set(courseId, JSON.stringify(course),"EX",604800);
        res.status(200).json({
          success: true,
          course,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get all courses
// export const getAllCourse = catchAsyncError(
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const isCacheExist = await redis.get("allCourses");

//       if (isCacheExist) {
//         const courses = JSON.parse(isCacheExist);
//         console.log("hitting redis");

//         res.status(200).json({
//           success: true,
//           courses,
//         });
//       } else {
//         const courses = await courseModel
//           .find()
//           .select(
//             "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
//           );
//         await redis.set("allCourses", JSON.stringify(courses));
//         console.log("hitting mongodb");

//         res.status(201).json({
//           success: true,
//           courses,
//         });
//       }
//     } catch (error: any) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   }
// );


export const getAllCourse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isCacheExist = await redis.get("allCourses");

      if (isCacheExist) {
        const courses = JSON.parse(isCacheExist);
        console.log("hitting redis");
        console.log("Courses from Redis:", courses);

        res.status(200).json({
          success: true,
          courses,
        });
      } else {
        const courses = await courseModel
          .find()
          .select(
            "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
          );
        console.log("Courses from MongoDB:", courses);
        await redis.set("allCourses", JSON.stringify(courses));
        console.log("hitting mongodb");

        res.status(201).json({
          success: true,
          courses,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// admin course
export const getAdminAllCourses = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllCoursesService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get course content for valid users who purchased that course

export const getCourseByUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      const courseId = req.params.id;

      if (!userCourseList) {
        return next(new ErrorHandler("User courses not found", 404));
      }

      // Find the course in the user's courses list by courseId
      const courseExists = userCourseList.find(
        (course: any) => course.courseId === courseId // Match by courseId
      );

      if (!courseExists) {
        return next(new ErrorHandler("Course not found", 404));
      }

      // Fetch the course details from the courseModel
      const course = await courseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      const content = course.courseData;

      // Return the course data
      res.status(200).json({
        success: true,
        course: content,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add questions in course

interface IAddQuestionsData {
  question: string;
  courseId: string;
  contentId: string;
}

export const addQuestion = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question, courseId, contentId }: IAddQuestionsData = req.body;
      const course = await courseModel.findById(courseId);
      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content id", 400));
      }
      // const courseContent=course?.courseData?.find((item:any)=>item._id===contentId);
      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      );
      if (!courseContent) {
        return next(new ErrorHandler("Invalid content id", 400));
      }
      // create a new question object
      const newQuestion: any = {
        user: req.user,
        question,
        questionReplies: [],
      };
      courseContent.questions.push(newQuestion);
      // Create notification logic here
      await notificationModel.create({
        user: req.user?._id,
        title: "New Question Recieved",
        message: `You have a new question in ${courseContent.title}`,
      });

      await course?.save();

      // Return the course data
      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add answer in course question
interface IAddAnswerData {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
}

export const addAnswer = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answer, courseId, contentId, questionId }: IAddAnswerData =
        req.body;
      const course = await courseModel.findById(courseId);
      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content id", 400));
      }
      // const courseContent=course?.courseData?.find((item:any)=>item._id===contentId);
      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      );
      if (!courseContent) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      const question = courseContent?.questions?.find((item: any) =>
        item._id.equals(questionId)
      );
      if (!question) {
        return next(new ErrorHandler("Invalid question id", 400));
      }
      // create a new answer object
      const newAnswer: any = {
        user: req.user,
        answer,
      };
      question.questionReplies.push(newAnswer);
      await course?.save();

      


      if (req.user?._id === question.user._id) {
        // Create notification logic here
      await notificationModel.create({
        user: req.user?._id,
        title: "New Question Reply Recieved",
        message: `You have a new question reply  in ${courseContent.title}`,
      });
      } else {
        const data = {
          name: question.user.name,
          title: courseContent.title,
        };
        const html = await ejs.renderFile(
          path.join(__dirname, "../mails/question-reply.ejs"),
          data
        );
        try {
          await sendMail({
            email: question.user.email,
            subject: "Question Reply",
            template: "question-reply.ejs",
            data,
          });
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 500));
        }
      }

      // Return the course data
      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add review in course
interface IAddReviewData {
  review: string;

  rating: number;
  // userId:string;
}

export const addReview = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      const courseId = req.params.id;

      console.log("User Courses:", userCourseList);
      console.log("Requested Course ID:", courseId);

      // Check if the course exists in the user's list
      const courseExist = userCourseList?.some(
        (course: any) => course.courseId === courseId
      );

      if (!courseExist) {
        return next(
          new ErrorHandler("You are not eligible to access this course", 400)
        );
      }

      // Fetch the course from the database
      const course = await courseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      const { review, rating } = req.body as IAddReviewData;

      // Create a new review object
      const reviewData: any = {
        user: req.user,
        comment: review,
        rating,
      };
      course.reviews.push(reviewData);

      // Calculate the average rating
      let avg = 0;
      course.reviews.forEach((rev: any) => {
        avg += rev.rating;
      });

      course.ratings = avg / course.reviews.length;

      await course.save();

      const notification = {
        title: "New review received",
        message: `${req.user?.name} has given a review in ${course.name}`,
      };

      


      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add reply in review
interface IAddReviewReplyData {
  comment: string;
  courseId: string;
  reviewId: string;
}

export const addReplyToReview = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { comment, courseId, reviewId } = req.body as IAddReviewReplyData;
      const course = await courseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }
      const review = course?.reviews?.find(
        (rev: any) => rev._id.toString() === reviewId
      );
      if (!review) {
        return next(new ErrorHandler("Review not found", 404));
      }
      // Create a new review object
      const replyData: any = {
        user: req.user,
        comment,
      };
      if(!review.commentReplies){
        review.commentReplies=[];
      }
      review?.commentReplies.push(replyData);

      await course?.save();

      const notification = {
        title: "New review received",
        message: `${req.user?.name} has given a review in ${course.name}`,
      };

      // Create notification logic here

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);


// get all courses
export const getAllCourses = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllCoursesService(res);
      
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// delete course
export const deleteCourse= catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
     const {id}=req.params;
const course=await courseModel.findById(id);
if(!course){
  return next(new ErrorHandler("User not found", 404));

}   
await course.deleteOne({id});   
await redis.del(id);
res.status(201).json({
  success: true,
  message:"Course deleted successfully",
});

    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// generate video url
export const generateVideoUrl = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { videoId } = req.body;
      const response = await axios.post(
        `https://dev.vdocipher.com/api/videos/${videoId}/otp`,
        { ttl: 300 },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Apisecret ${process.env.VDOCIPHER_API_SECRET}`,
          },
        }
      );
      res.json(response.data);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);