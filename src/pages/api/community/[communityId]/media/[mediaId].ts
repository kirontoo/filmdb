import { NextApiResponse, NextApiRequest } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

import prisma from "@/lib/prismadb";
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";
import {
  APIError,
  QueryError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/errors";
import { apiHandler } from "@/lib/apiHandler";

export default apiHandler({
  delete: deleteMedia,
  patch: updateMedia,
});

async function deleteMedia(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);
    const { query } = req;
    const { mediaId } = query;
    const id: string = Array.isArray(mediaId) ? mediaId[0] : mediaId!;

    // check permission
    const community = await prisma.community.findFirstOrThrow({
      where: {
        members: { some: { id: session!.user!.id } },
      },
    });

    if (community) {
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
    }
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      // Record Not Found
      if (e.code == "P2015") {
        throw new APIError("could not delete media");
      }

      throw new APIError(e.message, QueryError);
    }

    if (e instanceof PrismaClientValidationError) {
      throw new APIError(e.message, ValidationError);
    }

    throw e;
  }
}

async function updateMedia(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { query, body } = req;
    const { mediaId, communityId } = query;
    const id: string = Array.isArray(mediaId) ? mediaId[0] : mediaId!;
    const cId: string = Array.isArray(communityId)
      ? communityId[0]
      : communityId!;
    const session = await getServerSession(req, res, authOptions);

    // make sure user has permission
    // user is a member of the community
    const user = await prisma.user.findFirstOrThrow({
      where: {
        email: session!.user!.email,
        communities: {
          some: {
            id: cId,
            members: {
              some: { id: session!.user!.id },
            },
          },
        },
      },
    });

    if (user) {
      const watchedPropExists = body.hasOwnProperty("watched");
      const media = await prisma.media.update({
        where: {
          id: id,
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
}