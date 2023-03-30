import { NextApiResponse, NextApiRequest } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

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
  const { query, method, body } = req;
  const { id } = query;
  if (!id) {
    return res.status(400).send({
      status: "fail",
      message: "missing id",
    });
  }

  if (!body) {
    return res.status(400).send({
      status: "fail",
      message: "missing data",
    });
  }

  if (session) {
    // Signed in

    switch (method) {
      case "PATCH":
        const mediaId: string = Array.isArray(id) ? id[0] : id;
        await updateMedia(req, res, mediaId, session!.user!.email as string);
        break;
      default:
        res.setHeader("Allow", ["PATCH"]);
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

const updateMedia = async (
  req: NextApiRequest,
  res: NextApiResponse,
  mediaId: string,
  email: string
) => {
  try {
    const { body } = req;
    // make sure user has permission
    // user is a member of the community
    const user = await prisma.user.findFirstOrThrow({
      where: {
        email,
      },
      include: {
        communities: {
          include: {
            medias: {
              where: {
                id: mediaId,
              },
            },
          },
        },
      },
    });


    if (user.communities[0].medias.length > 0) {
      const watchedPropExists = body.hasOwnProperty("watched");
      const media = await prisma.media.update({
        where: {
          id: mediaId,
        },
        data: {
          watched: body.watched,
          dateWatched: watchedPropExists ? new Date() : undefined
        },
      });

      if (media) {
        return res.status(200).json({
          status: "success",
          data: {
            media,
          },
        });
      }
    } else {
      res.status(401).send({
        status: "error",
        message: "not authenticated",
      });
    }
  } catch (e) {
    console.log(e);
    if (e instanceof PrismaClientKnownRequestError) {
      return res.status(400).send({
        status: "fail",
        message: e.message,
      });
    }

    if (e instanceof PrismaClientValidationError) {
      return res.status(400).send({
        status: "fail",
        message: "missing data",
      });
    }

    return res.status(500).send({
      status: "error",
      message: "could not update media",
    });
  }
};
