import express from "express";
import { addAnswer,generateVideoUrl,getAdminAllCourses, addQuestion, addReplyToReview, addReview, deleteCourse, editCourse, getAllCourse, getAllCourses, getCourseByUser, getSingleCourse, uploadCourse } from "../controllers/course.controller";
import { authorizeRole, isAuthenticated } from "../middleware/auth";
import { updateAccessToken } from "../controllers/user.controller";

const courseRouter = express.Router();


courseRouter.post('/create-course',isAuthenticated,authorizeRole("admin"), uploadCourse);
courseRouter.put('/update-course/:id',isAuthenticated,authorizeRole("admin"), editCourse);
courseRouter.get('/get-course/:id', getSingleCourse);
courseRouter.get('/get-all-course', getAllCourse);
courseRouter.get('/get-course-content/:id',isAuthenticated, getCourseByUser);
// courseRouter.get(
//     "/get-admin-courses",
   
//     isAuthenticated,
//     authorizeRole("admin"),
//     getAdminAllCourses
//   );
courseRouter.put('/add-question',isAuthenticated, addQuestion);
courseRouter.put('/add-answer',isAuthenticated, addAnswer);
courseRouter.put('/add-review/:id',isAuthenticated, addReview);
courseRouter.put('/add-reply',isAuthenticated,authorizeRole("admin"), addReplyToReview);
courseRouter.get('/get-courses',isAuthenticated,authorizeRole("admin"), getAllCourses);   //sorting manner

courseRouter.delete('/delete-course/:id',isAuthenticated,authorizeRole("admin"), deleteCourse);   
courseRouter.post("/getVdoCipherOTP", generateVideoUrl);

export default courseRouter;
