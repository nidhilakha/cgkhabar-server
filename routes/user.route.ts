import express from "express";
import { activateUser, registerAdmin,deleteUser,addUserAsAdmin, getAllUsers, getUserInfo, loginUser, logoutUser, registrationUser, socialAuth, updateAccessToken, updateProfilePicture, updateUserInfo, updateUserPassword, updateUserProfilePicture, updateUserRole } from "../controllers/user.controller";
import { isAuthenticated ,authorizeRole} from "../middleware/auth";
const userRouter = express.Router();

userRouter.post('/registration', registrationUser);
userRouter.post('/registration_admin', registerAdmin);

userRouter.post('/admin/add-user',isAuthenticated,  addUserAsAdmin);

userRouter.post('/activate-user', activateUser);
userRouter.post('/login', loginUser);
userRouter.get('/logout',isAuthenticated,  logoutUser);
userRouter.get('/refreshtoken',  updateAccessToken);
userRouter.get('/me',isAuthenticated,  getUserInfo);
userRouter.post('/socialauth', socialAuth);
userRouter.put('/update-user-info',isAuthenticated,  updateUserInfo);
userRouter.put('/update-user-password',isAuthenticated,  updateUserPassword);
userRouter.put('/update-avatar',isAuthenticated,  updateProfilePicture);
userRouter.get('/get-users',isAuthenticated,authorizeRole("admin"), getAllUsers);   //sorting manner

userRouter.put('/update-user',isAuthenticated,authorizeRole("admin"), updateUserRole);  
userRouter.delete('/delete-user/:id',isAuthenticated,authorizeRole("admin"), deleteUser);   
userRouter.put('/update-profilepicture/:id', isAuthenticated, authorizeRole("admin"), updateUserProfilePicture);




export default userRouter;
