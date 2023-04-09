import { NextApiResponse, NextApiRequest } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

import prisma from "@/lib/prismadb";
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  const { query, method } = req;
  const { mediaId } = query;

  if (!mediaId) {
    return res.status(400).send({
      status: "fail",
      message: "missing id",
    });
  }

  if (session) {
    // Signed in

    switch (method) {
      case "DELETE":
        const mId: string = Array.isArray(mediaId) ? mediaId[0] : mediaId;
        await deleteMedia(req, res, mId);

      default:
        res.setHeader("Allow", ["DELETE"]);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } else {
    // Not Signed in
    res.status(401).send({
      status: "error",
      message: "not authenticated",
    });
  }

  res.end();
}

async function deleteMedia(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  try {
    const media = await prisma.media.delete({
      where: { id: id },
    });
    if (media) {
      return res.status(200).json({
        status: "success",
        data: {
          media,
        },
      });
    }
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      return res.status(400).send({
        status: "fail",
        message: e.message,
      });
    }

    return res.status(500).send({
      status: "error",
      message: "could not delete media",
    });
  }
}
