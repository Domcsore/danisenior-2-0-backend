import cookieParser from "cookie-parser";
import express, { Response } from "express";
import dotenv from "dotenv";
import {
  jwtMiddleware,
  LoginBody,
  RegisterBody,
  roleMiddleware,
  Roles,
  setTokenCookie,
  createToken,
  getReqToken,
  registerHandler,
  loginHandler,
  authHandler,
} from "./auth";
import { AppRequest } from "./request";
import { dbMiddleware } from "./db";
import bcrypt from "bcrypt";
import cors from "cors";
import { ApiErrorCodes, ApiError } from "./errors";

dotenv.config();

const app = express();
const port = 3000;

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(jwtMiddleware);
app.use(dbMiddleware);

app.post("/register", registerHandler);
app.post("/login", loginHandler);
app.get("/auth", authHandler);

app.get("/", roleMiddleware([Roles.ADMIN]), (req: AppRequest, res) => {
  res.json({ valid: req.validToken });
});

app.listen(process.env.PORT, () => {
  console.log(`Starting server on port ${process.env.PORT}`);
});
