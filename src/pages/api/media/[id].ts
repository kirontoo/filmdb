import { NextApiResponse, NextApiRequest } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

import prisma from "@/lib/prismadb";
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";
import { apiHandler } from "@/lib/apiHandler";
import { APIError, QueryError, UnauthorizedError, ValidationError } from "@/lib/errors";

export default apiHandler({
  patch: updateMedia,
});

async function updateMedia (req: NextApiRequest, res: NextApiResponse) {
  try {
    const { query, body } = req;
    const { id } = query;
    const mediaId: string = Array.isArray(id) ? id[0] : id!;
    const session = await getServerSession(req, res, authOptions);
    // make sure user has permission
    // user is a member of the community
    const user = await prisma.user.findFirstOrThrow({
      where: {
        email: session!.user!.email,
        communities: {
          some: {
            members: {
              some: {id: session!.user!.id}
            },
          },
        },
      },
    });

    if (user) {
      const watchedPropExists = body.hasOwnProperty("watched");
      const media = await prisma.media.update({
        where: {
          id: mediaId,
        },
        data: {
          watched: body.watched,
          dateWatched: watchedPropExists ? new Date() : undefined,
        },
      });

      if (media) {
        return res.status(200).json({
          status: "success",
          data: {
            media,
          },
        });
      } else {
        throw new Error("could not update media");
      }
    } else {
      throw new APIError("not authenticated", UnauthorizedError);
    }
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      throw new APIError(e.message, QueryError);
    }

    if (e instanceof PrismaClientValidationError) {
      throw new APIError(e.message, ValidationError);
    }

    throw e;
  }
};
