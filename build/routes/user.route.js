"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const auth_1 = require("../middleware/auth");
const userRouter = express_1.default.Router();
userRouter.post('/registration', user_controller_1.registrationUser);
userRouter.post('/registration_admin', user_controller_1.registerAdmin);
userRouter.post('/admin/add-user', auth_1.isAuthenticated, user_controller_1.addUserAsAdmin);
userRouter.post('/activate-user', user_controller_1.activateUser);
userRouter.post('/login', user_controller_1.loginUser);
userRouter.get('/logout', auth_1.isAuthenticated, user_controller_1.logoutUser);
userRouter.get('/refreshtoken', user_controller_1.updateAccessToken);
userRouter.get('/me', auth_1.isAuthenticated, user_controller_1.getUserInfo);
userRouter.post('/socialauth', user_controller_1.socialAuth);
userRouter.put('/update-user-info', auth_1.isAuthenticated, user_controller_1.updateUserInfo);
userRouter.put('/update-user-password', auth_1.isAuthenticated, user_controller_1.updateUserPassword);
userRouter.put('/update-avatar', auth_1.isAuthenticated, user_controller_1.updateProfilePicture);
userRouter.get('/get-users', auth_1.isAuthenticated, (0, auth_1.authorizeRole)("admin"), user_controller_1.getAllUsers); //sorting manner
userRouter.put('/update-user', auth_1.isAuthenticated, (0, auth_1.authorizeRole)("admin"), user_controller_1.updateUserRole);
userRouter.delete('/delete-user/:id', auth_1.isAuthenticated, (0, auth_1.authorizeRole)("admin"), user_controller_1.deleteUser);
userRouter.put('/update-profilepicture/:id', auth_1.isAuthenticated, (0, auth_1.authorizeRole)("admin"), user_controller_1.updateUserProfilePicture);
exports.default = userRouter;
