"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToken = exports.refreshTokenOptions = exports.accessTokenOptions = void 0;
require("dotenv").config();
const redis_1 = require("./redis");
const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_Expire || '300', 10);
const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || '1200', 10);
exports.accessTokenOptions = {
    expires: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000),
    maxAge: accessTokenExpire * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
};
exports.refreshTokenOptions = {
    expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
    maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
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
const sendToken = (user, statusCode, res) => {
    const accessToken = user.SignAccessToken();
    const refreshToken = user.SignRefreshToken();
    // upload session to redis
    redis_1.redis.set(user._id, JSON.stringify(user));
    // parse enviroment variables to integrates with fallback values
    // only set secure to true in production
    if (process.env.NODE_ENV == 'production') {
        exports.accessTokenOptions.secure = true;
    }
    res.cookie("access_token", accessToken, exports.accessTokenOptions);
    res.cookie("refresh_token", refreshToken, exports.refreshTokenOptions);
    res.status(statusCode).json({
        sucess: true,
        user,
        accessToken,
        refreshToken,
    });
};
exports.sendToken = sendToken;
