import express from "express";
import { authorizeRole, isAuthenticated } from "../middleware/auth";
import { createLayout, editLayout, getLayoutByType } from "../controllers/layout.controller";
const layoutRouter = express.Router();
layoutRouter.post('/create-layout',isAuthenticated,authorizeRole("admin"), createLayout);
layoutRouter.put('/update-layout',isAuthenticated,authorizeRole("admin"), editLayout);
// layoutRouter.get('/get-layout-by-type',getLayoutByType);
layoutRouter.get('/get-layout/:type',getLayoutByType);


export default layoutRouter;

