import { Response } from "express";

export enum ApiErrorCodes {
  INVALIDUSERORPASS = 0,
  INTERNALSERVERERROR,
  NOUSERNAMEORPASSWORD,
  PASSWORDHASH,
  INSERTINGUSER,
  UNAUTHORIZED,
  NOTFOUND,
}

export interface ApiError {
  status: number;
  code: number;
  message: string;
}

export const sendError = (res: Response, error: ApiError) => {
  res.statusCode = error.status;
  res.json(error);
};
