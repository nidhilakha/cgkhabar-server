"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const news_controller_1 = require("../controllers/news.controller");
const auth_1 = require("../middleware/auth");
const user_controller_1 = require("../controllers/user.controller");
const newsRouter = express_1.default.Router();
newsRouter.post('/create-news', user_controller_1.updateAccessToken, auth_1.isAuthenticated, (0, auth_1.authorizeRole)("admin"), news_controller_1.createNews);
newsRouter.put('/update-news/:id', auth_1.isAuthenticated, (0, auth_1.authorizeRole)("admin"), news_controller_1.updateNews);
newsRouter.delete('/delete-news/:id', auth_1.isAuthenticated, (0, auth_1.authorizeRole)("admin"), news_controller_1.deleteNews);
newsRouter.get('/news', news_controller_1.getAllNews);
newsRouter.get('/news/:id', news_controller_1.getNewsById);
newsRouter.get('/featured-news', news_controller_1.getSomeNews);
newsRouter.post('/news/banner', news_controller_1.getNewsWithBanner);
newsRouter.put('/news/:id/banner', auth_1.isAuthenticated, (0, auth_1.authorizeRole)("admin"), news_controller_1.updateNewsBanner);
newsRouter.get('/news/latest/:categoryId', news_controller_1.getLatestNewsByCategory);
newsRouter.post('/news/shorts', news_controller_1.getNewsWithShorts);
// newsRouter.post('/news/:id/comments', isAuthenticated, addComment);
// Route to add a reply to a comment
// newsRouter.post('/news/:newsId/comments/:commentId/replies', isAuthenticated, addReply);
exports.default = newsRouter;
