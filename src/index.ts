import cookieParser from "cookie-parser";
import express from "express";
import dotenv from "dotenv";
import { AppRequest } from "./request";
import { dbMiddleware } from "./db";
import cors from "cors";
import {
  jwtMiddleware,
  roleMiddleware,
  Roles,
  registerHandler,
  loginHandler,
  authHandler,
} from "./auth";
import { getBiographyHandler, postBiographyHandler } from './me';

dotenv.config();

const app = express();

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
app.get("/me/bio", roleMiddleware([Roles.ADMIN]), getBiographyHandler);
app.post("/me/bio", postBiographyHandler)

app.get("/", roleMiddleware([Roles.ADMIN]), (req: AppRequest, res) => {
  res.json({ valid: req.validToken });
});

app.listen(process.env.PORT, () => {
  console.log(`Starting server on port ${process.env.PORT}`);
});
