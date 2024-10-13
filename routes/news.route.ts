import express from "express";
import { createNews, updateNews, getNewsWithBanner,updateNewsBanner,deleteNews, getAllNews, getNewsById,getSomeNews, getLatestNewsByCategory, getNewsWithShorts } from "../controllers/news.controller";
import { isAuthenticated, authorizeRole } from "../middleware/auth";
import { updateAccessToken } from "../controllers/user.controller";


const newsRouter = express.Router();

newsRouter.post('/create-news', updateAccessToken,
    isAuthenticated, 
    authorizeRole("admin"), 
    createNews
  );
  newsRouter.put('/update-news/:id', isAuthenticated, authorizeRole("admin"), updateNews);
newsRouter.delete('/delete-news/:id', isAuthenticated, authorizeRole("admin"), deleteNews);
newsRouter.get('/news', getAllNews);
newsRouter.get('/news/:id', getNewsById);
newsRouter.get('/featured-news', getSomeNews);
newsRouter.post('/news/banner',getNewsWithBanner);

newsRouter.put('/news/:id/banner',isAuthenticated, authorizeRole("admin"), updateNewsBanner);
newsRouter.get('/news/latest/:categoryId', getLatestNewsByCategory);
newsRouter.post('/news/shorts',getNewsWithShorts);

// newsRouter.post('/news/:id/comments', isAuthenticated, addComment);

// Route to add a reply to a comment
// newsRouter.post('/news/:newsId/comments/:commentId/replies', isAuthenticated, addReply);
export default newsRouter;
