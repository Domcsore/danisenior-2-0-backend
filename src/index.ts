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
import bcrypt from "bcrypt";
import cors from "cors";

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
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
    const passwordHash = await bcrypt.hash(regBody.password, 10);
    await req.db?.collection("users").insertOne({
      email: regBody.email,
      password: passwordHash,
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

  let authenticated: Boolean = false;

  try {
    const result = await req.db
      ?.collection("users")
      .findOne({ email: { $eq: loginBody.email } });

    if (!result) {
      res.sendStatus(401);
      return;
    }

    authenticated = await bcrypt.compare(loginBody.password, result.password);

    if (!authenticated) {
      res.sendStatus(401);
      return;
    }

    setTokenCookie(
      res,
      createToken({
        email: result.email,
        roles: result.roles,
      })
    );

    res.sendStatus(200);
    return;
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
    return;
  }
});

app.use("/", roleMiddleware([Roles.ADMIN]));
app.get("/", (req: AppRequest, res) => {
  res.json({ valid: req.validToken });
});

app.listen(process.env.PORT, () => {
  console.log(`Starting server on port ${process.env.PORT}`);
});
