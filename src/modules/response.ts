import type { Response } from "express";



type TResponse<T> = {
  status: number,
  success: boolean,
  message?: string,
  data?: T,
  error?:any
}
 const sendResponse =<T> (res: Response, data:TResponse<T> ) => {
  res.status(data.status).json({
    success: data.success,
    message:data.message,
    data: data.data,
    errors:data.error
  })
}

export default sendResponse