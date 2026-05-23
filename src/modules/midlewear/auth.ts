import type { NextFunction, Request, Response } from "express"
import sendResponse from "../response"
import jwt, { type JwtPayload } from 'jsonwebtoken'
import config from "../../config/dotenv"
import { pool } from "../../config/db"

export const auth = (...role: string[]) => {
 
  return async (req: Request, res: Response, next: NextFunction) => {
    //  console.log(role);
    try {
      const token = req.headers.authorization

      if (!token) {
        sendResponse(res, { status: 401, success: false, message: "unauthorized" })
        return
      }

    const decoded = jwt.verify(token, config.jwt_secret as string)as JwtPayload
       
      const findUser = await pool.query(
        `SELECT * FROM users 
        WHERE id=$1
        `,[decoded?.user_id]
      )

      if (findUser.rows[0].length === 0) {
         sendResponse(res, {
           status: 401,
           success: false,
           message: 'unauthorized',
         });
         return;
      }
      const user = findUser.rows[0]

      if (role.length && !role.includes(user.role)) {
          sendResponse(res, {
            status: 403,
            success: false,
            message: 'Forbidden access',
          });
      }

      req.user = decoded;


      next()
    } catch (error:any) {
       sendResponse(res, {
         status: 500,
         success: false,
         message: error?.message,
         error:error
       });
    }
  }
}