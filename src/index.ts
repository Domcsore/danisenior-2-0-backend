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
} from "./routes/auth";
import { getEditorHtmlHandler, postEditorHtmlHandler } from "./routes/editor";
import { getImageHandler, postImageHandler } from "./routes/image";
import {
  deleteSongHanlder,
  getSongsHandler,
  postSongHandler,
} from "./routes/songs";
import { getMediaHandler, postMediaHandler } from "./routes/media";

// INIT
dotenv.config();
const app = express();

// ALL ROUTE MIDDLEWARE
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3002"],
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

app.get("/editor/:editorName", getEditorHtmlHandler);
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

app.post(
  "/song/:id",
  roleMiddleware([Roles.ADMIN]),
  fileUpload(),
  postSongHandler
);
app.get("/songs", getSongsHandler);
app.delete("/song/:id", roleMiddleware([Roles.ADMIN]), deleteSongHanlder);

app.post(
  "/media/:id",
  roleMiddleware([Roles.ADMIN]),
  fileUpload(),
  postMediaHandler
);
app.get("/media", getMediaHandler);

app.get("/", roleMiddleware([Roles.ADMIN]), (req: AppRequest, res) => {
  res.json({ valid: req.validToken });
});

app.listen(process.env.PORT, () => {
  console.log(`Starting server on port ${process.env.PORT}`);
});
