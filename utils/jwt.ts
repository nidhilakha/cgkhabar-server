import { Request, Response, NextFunction } from "express";
require("dotenv").config();
import  { IUser } from "../models/user.model";

import { redis } from "./redis";


interface iTokenOptions{
    expires:Date;
    maxAge:number;
    httpOnly:boolean;
    sameSite:'lax'|'strict'|'none'|undefined;
    secure?:boolean;

}

 const accessTokenExpire=parseInt(process.env.ACCESS_TOKEN_Expire||'300',10);
 const refreshTokenExpire=parseInt(process.env.REFRESH_TOKEN_EXPIRE||'1200',10);

export const accessTokenOptions:iTokenOptions={
    expires:new Date(Date.now()+accessTokenExpire*60*60*1000),
    maxAge:accessTokenExpire*60*60*1000,
    httpOnly:true,
    sameSite:'lax',
};

export const refreshTokenOptions:iTokenOptions={
    expires:new Date(Date.now()+refreshTokenExpire*24*60*60*1000),
    maxAge:refreshTokenExpire*24*60*60*1000,
    httpOnly:true,
    sameSite:'lax',
};


// const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || '300', 10); // in seconds
// const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || '1200', 10); // in seconds

// export const accessTokenOptions: iTokenOptions = {
//     expires: new Date(Date.now() + accessTokenExpire * 1000), // in milliseconds
//     maxAge: accessTokenExpire * 1000, // in milliseconds
//     httpOnly: true,
//     sameSite: 'lax',
// };

// export const refreshTokenOptions: iTokenOptions = {
//     expires: new Date(Date.now() + refreshTokenExpire * 1000), // in milliseconds
//     maxAge: refreshTokenExpire * 1000, // in milliseconds
//     httpOnly: true,
//     sameSite: 'lax',
// };

export const sendToken=(user:IUser,statusCode:number,res:Response)=>{
const accessToken=user.SignAccessToken();
const refreshToken=user.SignRefreshToken();

// upload session to redis
redis.set(user._id as any,JSON.stringify(user) as any);



// parse enviroment variables to integrates with fallback values


// only set secure to true in production
if(process.env.NODE_ENV=='production'){
    accessTokenOptions.secure=true;
}

res.cookie("access_token",accessToken,accessTokenOptions);
res.cookie("refresh_token",refreshToken,refreshTokenOptions);

res.status(statusCode).json({
    sucess:true,
    user,
    accessToken,
    refreshToken,
});

}