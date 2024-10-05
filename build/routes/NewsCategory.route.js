"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const newsCategory_controller_1 = require("../controllers/newsCategory.controller");
const categoryRouter = express_1.default.Router();
categoryRouter.post('/create-category', auth_1.isAuthenticated, (0, auth_1.authorizeRole)("admin"), newsCategory_controller_1.addNewsCategory);
categoryRouter.get('/categories', newsCategory_controller_1.getAllNewsCategories);
categoryRouter.put('/update-category/:id', auth_1.isAuthenticated, (0, auth_1.authorizeRole)("admin"), newsCategory_controller_1.updateNewsCategory);
categoryRouter.delete('/delete-category/:id', auth_1.isAuthenticated, (0, auth_1.authorizeRole)("admin"), newsCategory_controller_1.deleteNewsCategory);
categoryRouter.get('/category/:id', newsCategory_controller_1.getNewsCategoryById);
exports.default = categoryRouter;
