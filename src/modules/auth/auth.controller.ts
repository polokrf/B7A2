import type { Request, Response } from "express";
import { authService } from "./auth.service";
import sendResponse from "../response";

const signup = async (req:Request, res:Response) => {
  try {
    
    const result = await authService.signupDB(req.body)
    if (result?.rows?.length === 0) {
      sendResponse(res, {
        status: 400,
        success: false,
        message: 'user register not success',
      });
      return
    }
    delete result?.rows[0]?.password;
   
    sendResponse(res, {
      status: 200,
      success: true,
      message: 'User registered successfully',
      data:result?.rows[0]
    });

    // console.log(result?.rows)
    
  } catch (error:any) {
    sendResponse(res, {
      status: 500,
      success: false,
      message:error.message as string,
      error:error,
    });
  }
}
const login = async (req:Request, res:Response) => {
  try {
    
    const result = await authService.loginDB(req.body)
    if (result?.user.length === 0) {
      sendResponse(res, {
        status:401,
        success: false,
        message: 'Login not success',
      });
      return
    }
    delete result?.user?.password;
   
    sendResponse(res, {
      status: 200,
      success: true,
      message: 'Login successful',
      data: { token: result?.token, user: result?.user },
    });
    
  } catch (error:any) {
    sendResponse(res, {
      status: 500,
      success: false,
      message:error.message as string,
      error:error,
    });
  }
}

export const authController = {
  signup,
  login
}