import { AppRequest } from "./request";
import { RequestHandler, Response, NextFunction } from "express";
import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";
import { ApiErrorCodes, ApiError, sendError } from "./errors";
import bcrypt from "bcrypt";
import { Db } from "mongodb";

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
  res.cookie(tokenCookieName, token, {
    maxAge: 2100000,
    sameSite: "none",
    httpOnly: true,
    secure: true,
  });

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

    sendError(res, {
      status: 403,
      code: ApiErrorCodes.UNAUTHORIZED,
      message: "Not authorized to access this endpoint.",
    });
  };
};

const insertUserToDb = async (email: string, plainPassword: string, db: Db) => {
  try {
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    return db.collection("users").insertOne({
      email: email,
      password: passwordHash,
      roles: [Roles.ADMIN],
    });
  } catch (e) {
    throw e;
  }
};

export const registerHandler = async (req: AppRequest, res: Response) => {
  const regBody: RegisterBody = req.body as RegisterBody;
  const validRequest = !regBody.email || !regBody.password;
  if (validRequest) {
    sendError(res, {
      status: 400,
      code: ApiErrorCodes.NOUSERNAMEORPASSWORD,
      message: "No username or password received.",
    });
    return;
  }

  try {
    req.db && (await insertUserToDb(regBody.email, regBody.password, req.db));
  } catch (e) {
    console.log(e);
    const apiError: ApiError = {
      status: 500,
      code: ApiErrorCodes.INTERNALSERVERERROR,
      message: "We had trouble dealing with this request.",
    };
    sendError(res, apiError);
    return;
  }

  res.statusCode = 200;
  res.json({ message: "OK" });
};

const getUserFromDb = async (email: string, db: Db) => {
  return db.collection("users").findOne({ email: { $eq: email } });
};

const sendSuccessfulAuth = (res: Response, user: User) => {
  setTokenCookie(
    res,
    createToken({
      email: user.email,
      roles: user.roles,
    })
  );
  res.statusCode = 200;
  res.json(user);
};

export const loginHandler = async (req: AppRequest, res: Response) => {
  const loginBody: LoginBody = req.body as LoginBody;
  const validRequest = !loginBody.email || !loginBody.password;
  if (validRequest) {
    sendError(res, {
      status: 400,
      code: ApiErrorCodes.NOUSERNAMEORPASSWORD,
      message: "No username or password received.",
    });
    return;
  }

  try {
    const user = req.db && (await getUserFromDb(loginBody.email, req.db));

    if (!user) {
      sendError(res, {
        status: 401,
        code: ApiErrorCodes.INVALIDUSERORPASS,
        message: "No user found.",
      });
      return;
    }

    const authenticated = await bcrypt.compare(
      loginBody.password,
      user.password
    );

    if (!authenticated) {
      sendError(res, {
        status: 401,
        code: ApiErrorCodes.INVALIDUSERORPASS,
        message: "Incorrect username or password.",
      });
      return;
    }

    sendSuccessfulAuth(res, user);
    return;
  } catch (e) {
    console.log(e);
    sendError(res, {
      status: 500,
      code: ApiErrorCodes.INTERNALSERVERERROR,
      message: "We had trouble dealing with this request.",
    });
    return;
  }
};

export const authHandler = (req: AppRequest, res: Response) => {
  if (!req.validToken) {
    sendError(res, {
      status: 401,
      code: ApiErrorCodes.UNAUTHORIZED,
      message: "Unauthorised",
    });
    return;
  }

  if (!req.user) {
    sendError(res, {
      status: 500,
      code: ApiErrorCodes.INTERNALSERVERERROR,
      message: "Something went wrong.",
    });
    console.log(
      "User not attached to request object. Something probably went wrong int JWT middleware"
    );
    return;
  }

  res.statusCode = 200;
  res.json(req.user);
};
