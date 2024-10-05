import express from "express";
import { authorizeRole, isAuthenticated } from "../middleware/auth";
import { addNewsCategory,getNewsCategoryById, getAllNewsCategories ,updateNewsCategory,deleteNewsCategory} from "../controllers/newsCategory.controller";

const categoryRouter = express.Router();


categoryRouter.post('/create-category',isAuthenticated,authorizeRole("admin"), addNewsCategory);
categoryRouter.get('/categories',  getAllNewsCategories);
categoryRouter.put('/update-category/:id', isAuthenticated, authorizeRole("admin"), updateNewsCategory);
categoryRouter.delete('/delete-category/:id', isAuthenticated, authorizeRole("admin"), deleteNewsCategory);
categoryRouter.get('/category/:id',  getNewsCategoryById);


export default categoryRouter;
