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
} from "./auth";
import { AppRequest } from "./request";
import { dbMiddleware } from "./db";

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());
app.use(cookieParser());
app.use(jwtMiddleware);
app.use(dbMiddleware);

app.post("/register", async (req: AppRequest, res: Response) => {
  const regBody: RegisterBody = req.body as RegisterBody;
  if (!regBody.email || !regBody.password) {
    res.sendStatus(400);
    return;
  }

  try {
    const result = await req.db?.collection("users").insertOne({
      email: regBody.email,
      // TODO HASH PASSWORD
      password: regBody.password,
      roles: [Roles.ADMIN],
    });
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
    return;
  }

  res.sendStatus(200);
});

app.post("/login", async (req: AppRequest, res: Response) => {
  const loginBody: LoginBody = req.body as LoginBody;
  if (!loginBody.email || !loginBody.password) {
    res.sendStatus(400);
    return;
  }

  let result;

  try {
    result = await req.db
      ?.collection("users")
      .findOne({ email: { $eq: loginBody.email } });
    console.log(result);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }

  // TODO USE HASHED PASSWORD
  if (result.password === loginBody.password) {
    setTokenCookie(
      res,
      createToken({
        email: result.email,
        roles: result.roles,
      })
    );
  }
  res.sendStatus(200);
});

app.use("/", roleMiddleware([Roles.EDITOR]));
app.get("/", (req: AppRequest, res) => {
  res.json({ valid: req.validToken });
});

app.listen(port, () => {
  console.log("Starting server...");
});
