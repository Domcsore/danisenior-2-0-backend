import { NextFunction, RequestHandler, Response } from "express";
import { Db, MongoClient } from "mongodb";
import { AppRequest } from "./request";
import dotenv from "dotenv";

dotenv.config();

const getConnectionUri = (
  username: string,
  password: string,
  host: string,
  port: number = 27017
) => `mongodb://${username}:${password}@${host}:${port}`;

const mongo = new MongoClient(
  getConnectionUri(
    process.env.DBUSER as string,
    process.env.DBPASS as string,
    process.env.DBHOST as string
  ),
  { useUnifiedTopology: true }
);

let db: Db;

mongo
  .connect()
  .then((client: MongoClient) => {
    console.log("Connected to database");
    db = client.db(process.env.DBNAME);
  })
  .catch((reason) => {
    console.log(reason);
    process.exit(-1);
  });

export const dbMiddleware: RequestHandler = (
  req: AppRequest,
  res: Response,
  next: NextFunction
) => {
  req.db = db;
  next();
};
