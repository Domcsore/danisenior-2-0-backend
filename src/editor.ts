import { json, Response } from "express";
import { AppRequest } from "./request";
import { ApiErrorCodes, sendError } from "./errors";

interface EditorRequest {
  html: string;
}

export const getEditorHtmlHandler = async (req: AppRequest, res: Response) => {
  try {
    const result = await req.db
      ?.collection("editorHtml")
      .findOne({ name: { $eq: req.params.editorName } });

    if (!result) {
      res.json({
        html: "",
      });
      return;
    }

    res.json({
      html: result.html,
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

export const postEditorHtmlHandler = async (req: AppRequest, res: Response) => {
  const editorReq: EditorRequest = req.body as EditorRequest;
  try {
    const result = await req.db
      ?.collection("editorHtml")
      .updateOne(
        { name: { $eq: req.params.editorName } },
        { $set: { html: editorReq.html } },
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
    message: "OK",
  });
};
