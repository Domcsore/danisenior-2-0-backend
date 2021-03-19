import { UploadedFile } from "express-fileupload";
import { Response } from "express";
import sharp from "sharp";
import syncFs, { promises as fs } from "fs";
import { ObjectID } from "mongodb";
import { AppRequest } from "./request";
import { ApiErrorCodes, sendError } from "./errors";
import { existsSync } from "node:fs";

export const postSongHandler = async (req: AppRequest, res: Response) => {
  const id =
    req.params["id"] !== "new"
      ? req.params["id"]
      : ObjectID.createFromTime(Date.now()).toHexString();
  const record = req.body.record;
  const credits = req.body.credits;
  const imageFile = req.files?.file;
  const alreadyHasImage = syncFs.existsSync(
    `${process.env.DATAPATH}/images/songs/${id}.jpg`
  );

  if (imageFile) {
    try {
      const imageFolderExists = syncFs.existsSync(
        `${process.env.DATAPATH}/images/songs`
      );
      !imageFolderExists &&
        (await fs.mkdir(`${process.env.DATAPATH}/images/songs`));

      const sImage = sharp((imageFile as UploadedFile).data);
      await sImage.resize(60, 60);

      await sImage.toFile(`${process.env.DATAPATH}/images/songs/${id}.jpg`);
    } catch (e) {
      console.log(e);
      sendError(res, {
        status: 500,
        code: ApiErrorCodes.INTERNALSERVERERROR,
        message: "Something went wrong",
      });
      return;
    }
  }

  try {
    const result = await req.db?.collection("songs").updateOne(
      { _id: { $eq: id } },
      {
        $set: {
          record,
          credits,
          imgSrc:
            imageFile || alreadyHasImage ? `images/songs/${id}.jpg` : null,
        },
      },
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

  if (req.params["id"] === "new") {
    res.json({
      _id: id,
      imgSrc: imageFile || alreadyHasImage ? `images/songs/${id}.jpg` : null,
      record,
      credits,
    });
    return;
  }

  res.json({
    message: "OK",
  });
};

export const getSongsHandler = async (req: AppRequest, res: Response) => {
  try {
    const results = await req.db?.collection("songs").find();

    if (!results) {
      sendError(res, {
        status: 404,
        code: ApiErrorCodes.NOTFOUND,
        message: "Not found",
      });
      return;
    }

    const resResult: any[] = [];

    await results.forEach((result) => {
      resResult.push(result);
    });

    res.json(resResult);
  } catch (e) {
    console.log(e);
    sendError(res, {
      status: 500,
      code: ApiErrorCodes.INTERNALSERVERERROR,
      message: "Something went wrong",
    });
  }
};

export const deleteSongHanlder = async (req: AppRequest, res: Response) => {
  const id = req.params["id"];

  // TODO delete image file

  try {
    const result = await req.db
      ?.collection("songs")
      .deleteOne({ _id: { $eq: id } });

    if (!result) {
      sendError(res, {
        status: 404,
        code: ApiErrorCodes.NOTFOUND,
        message: "Not found",
      });
      return;
    }
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
