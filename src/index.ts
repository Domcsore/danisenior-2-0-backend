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
import { getEditorHtmlHandler, postEditorHtmlHandler } from "./editor";

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
app.get(
  "/editor/:editorName",
  roleMiddleware([Roles.ADMIN]),
  getEditorHtmlHandler
);
app.post(
  "/editor/:editorName",
  roleMiddleware([Roles.ADMIN]),
  postEditorHtmlHandler
);

app.get("/", roleMiddleware([Roles.ADMIN]), (req: AppRequest, res) => {
  res.json({ valid: req.validToken });
});

app.listen(process.env.PORT, () => {
  console.log(`Starting server on port ${process.env.PORT}`);
});
