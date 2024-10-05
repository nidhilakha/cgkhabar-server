import { Request, Response, NextFunction } from "express";
require("dotenv").config();
import { IUser } from "../models/user.model";

declare global{
    namespace Express{
        interface Request{
            user?:IUser;
        }
    }
}