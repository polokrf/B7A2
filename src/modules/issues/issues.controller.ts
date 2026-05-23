import type { Request, Response } from "express";
import sendResponse from "../response";
import { issuesService } from "./issues.service";

// create all issue
const createIssues = async (req: Request, res: Response) => {

  try {
    const result = await issuesService.createIssuesDB(req.body,req.user);
    if (result?.rows.length === 0) {
      sendResponse(res, {
        status: 400,
        success: false,
        message:'issues not created',
      });
      return
    }

    sendResponse(res, {
      status: 201,
      success: true,
      message: 'Issue created successfully',
      data:result?.rows[0],
    });
    
  } catch (error:any) {
    sendResponse(res,{status:500,success:false,message:error?.message, error:error})
  }
}

// get all issues
const getIssues = async (req:Request, res:Response) => {
  try {
    const result = await issuesService.getIssuesDB(req.query)
    if (result?.length === 0) {
      sendResponse(res, {
        status: 204,
        success: false,
      
      });
      return
    }
    sendResponse(res, {
      status: 200,
      success: true,
      message: 'Issues retrived successfully',
      data: result,
    });
    
    // console.log(result)
  } catch (error:any) {
     sendResponse(res, {
       status: 500,
       success: false,
       message: error?.message,
       error: error,
     });
  }
}
// get single  issues
const getSingleIssues = async (req:Request, res:Response) => {
  try {
    const {id}=req.params
    const result = await issuesService.getSingleIssueDB(id as string)
    if (!result) {
      sendResponse(res, {
        status: 204,
        success: false,
      
      });
      return
    }
    // console.log(result)
    sendResponse(res, {
      status: 200,
      success: true,
      message: 'Issue retrived successfully',
      data: result,
    });
    
    
  } catch (error:any) {
     sendResponse(res, {
       status: 500,
       success: false,
       message: error?.message,
       error: error,
     });
  }
}
// update only own issues
const updateIssues = async (req:Request, res:Response) => {
  try {
    const { id } = req.params
    
    const result = await issuesService.updateIssuesDB(req, id as string)
    // console.log(result)
    if (result?.rows.length === 0) {
      sendResponse(res, {
        status: 403,
        success: false,
        message: 'Issue updated not success',
      });
      return
    }
    // console.log(result)
    sendResponse(res, {
      status: 200,
      success: true,
      message:"Issue updated successfully",
      data: result?.rows[0]
    });
    
  } catch (error:any) {
     sendResponse(res, {
       status: 500,
       success: false,
       message: error?.message,
       error: error,
     });
  }
}
// deleted issues
const deleteIssues = async (req:Request, res:Response) => {
  try {
    const { id } = req.params
    console.log(req?.user?.role);
    const result = await issuesService.deleteIssuesDB(id as string);
    console.log(result)
    
    sendResponse(res, {
      status: 200,
      success: true,
      message: 'Issue deleted successfully',
    });
    
  } catch (error:any) {
     sendResponse(res, {
       status: 500,
       success: false,
       message: error?.message,
       error: error,
     });
  }
}
export const issuesController = {
  createIssues,
  getIssues,
  updateIssues,
  deleteIssues,
  getSingleIssues
}