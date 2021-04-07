import syncFs, { promises as fs } from "fs";
import { UploadedFile } from "express-fileupload";
import sharp from "sharp";
import { Response } from "express";
import { AppRequest } from "../request";
import { ApiErrorCodes, sendError } from "../errors";

export const postImageHandler = async (req: AppRequest, res: Response) => {
  const name = req.params["name"];
  const alt = req.body.alt;
  const width = parseInt(req.body.width);
  const height = parseInt(req.body.height);
  const imageFile = req.files?.file;

  if (imageFile) {
    try {
      const imageFolderExists = syncFs.existsSync(
        `${process.env.DATAPATH}/images`
      );
      !imageFolderExists && (await fs.mkdir(`${process.env.DATAPATH}/images`));

      const sImage = sharp((imageFile as UploadedFile).data);

      if (!!width || !!height) {
        await sImage.resize(!!width ? width : null, !!height ? height : null);
      }

      await sImage.toFile(`${process.env.DATAPATH}/images/${name}.jpg`);
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
    const result = await req.db
      ?.collection("images")
      .updateOne(
        { name: { $eq: name } },
        { $set: { alt, src: `images/${name}.jpg` } },
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

export const getImageHandler = async (req: AppRequest, res: Response) => {
  const name = req.params["name"];

  try {
    const result = await req.db
      ?.collection("images")
      .findOne({ name: { $eq: name } });

    if (!result) {
      sendError(res, {
        status: 404,
        code: ApiErrorCodes.NOTFOUND,
        message: "Not found",
      });
      return;
    }

    res.json({
      name: result.name,
      alt: result.alt,
      src: result.src,
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
