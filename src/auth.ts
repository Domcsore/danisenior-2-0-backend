import { AppRequest } from "./request";
import { RequestHandler, Response, CookieOptions, NextFunction } from "express";
import jsonwebtoken, { Secret } from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

export enum Roles {
  ADMIN = "ADMIN",
  EDITOR = "EDITOR",
}

export interface RegisterBody {
  email: string;
  password: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface User {
  email: string;
  roles: Roles[];
}

export const createToken = (user: User): string =>
  jsonwebtoken.sign(user, process.env.JWTKEY as string, {
    expiresIn: 1800000,
  });

export const tokenCookieName = "_dsjwt";

export const getReqToken = (req: AppRequest): string =>
  req.cookies[tokenCookieName];

export const setTokenCookie = (res: Response, token: string) =>
  res.cookie(tokenCookieName, token, { maxAge: 2100000 });

export const jwtMiddleware: RequestHandler = (
  req: AppRequest,
  res: Response,
  next: NextFunction
) => {
  // Get jwt from request cookies
  const jwt: string = getReqToken(req);

  if (!jwt) {
    next();
    return;
  }

  try {
    // Try verify jwt
    const user: User = jsonwebtoken.verify(
      jwt,
      process.env.JWTKEY as string
    ) as User;
    // Didn't throw ~ Verification successful

    // Add details to req object
    req.user = user;
    req.validToken = true;

    // Generate new JWT
    const newJwt = createToken({ email: user.email, roles: user.roles });

    // Set new jwt in cookie response;
    setTokenCookie(res, newJwt);
  } catch (e) {
    // Add failed verification to req object
    req.validToken = false;
    console.log(e);
  }
  next();
};

export const roleMiddleware = (allowedRoles: Roles[]): RequestHandler => {
  return (req: AppRequest, res: Response, next: NextFunction) => {
    if (
      req.user?.roles.some((role) =>
        allowedRoles.some((aRole) => aRole === role)
      )
    ) {
      next();
      return;
    }

    res.status(403);
    res.json({ error: "Unauthorized" });
  };
};
