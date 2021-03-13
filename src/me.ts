import { json, Response } from "express";
import { AppRequest } from "./request";
import { ApiErrorCodes, sendError } from "./errors";

interface BiographyRequest {
  biography: string;
}

export const getBiographyHandler = async (req: AppRequest, res: Response) => {
  try {
    const result = await req.db
      ?.collection("htmlData")
      .findOne({ title: { $eq: "biography" } });

    if (!result) {
      res.json({
        biography: "",
      });
      return;
    }

    res.json({
      biography: result.html,
    });
  } catch (e) {
    console.log(e);
    sendError(res, {
      status: 500,
      code: ApiErrorCodes.INTERNALSERVERERROR,
      message: "Something went wrong",
    });
  }
};

export const postBiographyHandler = async (req: AppRequest, res: Response) => {
  const biographyReq: BiographyRequest = req.body as BiographyRequest;
  try {
    const result = await req.db
      ?.collection("htmlData")
      .updateOne(
        { title: { $eq: "biography" } },
        { $set: { html: biographyReq.biography }},
        { upsert: true }
      );
  } catch (e) {
    console.log(e);
    sendError(res, {
      status: 500,
      code: ApiErrorCodes.INTERNALSERVERERROR,
      message: "Something went wrong",
    });
    return;
  }

  res.json({
    massage: "OK",
  });
};
