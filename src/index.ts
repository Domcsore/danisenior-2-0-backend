import cookieParser from "cookie-parser";
import express from "express";
import dotenv from "dotenv";
import { AppRequest } from "./request";
import { dbMiddleware } from "./db";
import cors from "cors";
import fileUpload from "express-fileupload";
import {
  jwtMiddleware,
  roleMiddleware,
  Roles,
  registerHandler,
  loginHandler,
  authHandler,
} from "./auth";
import { getEditorHtmlHandler, postEditorHtmlHandler } from "./editor";
import { getImageHandler, postImageHandler } from "./image";

// INIT
dotenv.config();
const app = express();

// ALL ROUTE MIDDLEWARE
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

// STATIC ROUTES
app.use("/data", express.static(process.env.DATAPATH as string));

// API ROUTES
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

app.post(
  "/image/:name",
  roleMiddleware([Roles.ADMIN]),
  fileUpload(),
  postImageHandler
);
app.get("/image/:name", getImageHandler);

app.get("/", roleMiddleware([Roles.ADMIN]), (req: AppRequest, res) => {
  res.json({ valid: req.validToken });
});

app.listen(process.env.PORT, () => {
  console.log(`Starting server on port ${process.env.PORT}`);
});
