import { User } from "./auth";
import { Request } from "express";
import { Db } from "mongodb";

export interface AppCookies {
  _dsjwt: string;
}

export interface AppRequest extends Request {
  user?: User;
  validToken?: Boolean;
  cookies: AppCookies;
  db?: Db;
}
