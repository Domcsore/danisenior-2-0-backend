import { FileArray, UploadedFile } from "express-fileupload";
import { Response } from "express";
import sharp from "sharp";
import syncFs, { promises as fs } from "fs";
import { Db, ObjectID } from "mongodb";
import path from "path";
import { AppRequest } from "../request";
import { ApiErrorCodes, sendError } from "../errors";

const insertMediaToDb = async (
  db: Db,
  id: string,
  type: string,
  src: any,
  blurb: string
) => {
  try {
    await db.collection("media").updateOne(
      { _id: { $eq: id } },
      {
        $set: {
          type,
          src,
          blurb,
        },
      },
      { upsert: true }
    );
    return;
  } catch (e) {
    throw e;
  }
};

const handleYoutube = async (req: AppRequest, id: string) => {
  const value = req.body.value as string;
  const type = req.body.type;
  const blurb = req.body.blurb;

  try {
    !!req.db && (await insertMediaToDb(req.db, id, type, value, blurb));
    return;
  } catch (e) {
    throw e;
  }
};

const handleSingleImage = async (req: AppRequest, id: string) => {
  const value = req.files?.value;
  const type = req.body.type;
  const blurb = req.body.blurb;

  try {
    const imageFolderExists = syncFs.existsSync(
      `${process.env.DATAPATH}/media`
    );
    !imageFolderExists && (await fs.mkdir(`${process.env.DATAPATH}/media`));

    const sImage = sharp((value as UploadedFile).data);
    await sImage.resize(425, 318);
    await sImage.toFile(`${process.env.DATAPATH}/media/${id}.jpg`);

    !!req.db &&
      (await insertMediaToDb(req.db, id, type, `/media/${id}.jpg`, blurb));
  } catch (e) {
    throw e;
  }
};

const handleMultiImage = async (req: AppRequest, id: string) => {
  const imageOne = req.files?.value;
  const imageTwo = req.files?.mValue;
  const type = req.body.type;
  const blurb = req.body.blurb;

  try {
    const imageFolderExists = syncFs.existsSync(
      `${process.env.DATAPATH}/media`
    );
    !imageFolderExists && (await fs.mkdir(`${process.env.DATAPATH}/media`));

    const sImageOne = sharp((imageOne as UploadedFile).data);
    await sImageOne.resize(190, 238);
    await sImageOne.toFile(`${process.env.DATAPATH}/media/${id}-one.jpg`);
    const sImageTwo = sharp((imageTwo as UploadedFile).data);
    await sImageTwo.resize(190, 238);
    await sImageTwo.toFile(`${process.env.DATAPATH}/media/${id}-two.jpg`);

    !!req.db &&
      insertMediaToDb(
        req.db,
        id,
        type,
        [`/media/${id}-one.jpg`, `/media/${id}-two.jpg`],
        blurb
      );
  } catch (e) {
    throw e;
  }
};

const handleVideo = async (req: AppRequest, id: string) => {
  const value = req.files?.value as UploadedFile;
  const filename = `${id}${path.extname(value.name)}`;
  const type = req.body.type;
  const blurb = req.body.blurb;

  try {
    const imageFolderExists = syncFs.existsSync(
      `${process.env.DATAPATH}/media`
    );
    !imageFolderExists && (await fs.mkdir(`${process.env.DATAPATH}/media`));

    await fs.writeFile(`${process.env.DATAPATH}/media/${filename}`, value.data);

    !!req.db &&
      (await insertMediaToDb(req.db, id, type, `/media/${filename}`, blurb));
  } catch (e) {
    throw e;
  }
};

export const postMediaHandler = async (req: AppRequest, res: Response) => {
  const id =
    req.params["id"] !== "new"
      ? req.params["id"]
      : ObjectID.createFromTime(Date.now()).toHexString();
  const type = req.body.type;

  try {
    switch (type) {
      case "youtube":
        await handleYoutube(req, id);
        break;
      case "video":
        await handleVideo(req, id);
        break;
      case "singleimage":
        await handleSingleImage(req, id);
        break;
      case "multiimage":
        await handleMultiImage(req, id);
        break;
      default:
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
    _id: id,
    type,
  });
};

export const getMediaHandler = async (req: AppRequest, res: Response) => {
  try {
    const results = await req.db?.collection("media").find();

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

export const deleteMediaHandler = async (req: AppRequest, res: Response) => {
  const id = req.params["id"];

  try {
    await fs.rm(`${process.env.DATAPATH}/images/songs/${id}.jpg`);
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
