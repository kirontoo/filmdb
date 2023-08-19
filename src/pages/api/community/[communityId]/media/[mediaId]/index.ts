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
import { createHandler } from "@/lib/api/handler";
import { getQueueCount } from "@/lib/api/util";
import { ObjectId } from "bson";

export default createHandler({
  get: getMediaFromCommunity,
  delete: deleteMedia,
  patch: updateMedia,
});

async function getMediaFromCommunity(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getServerSession(req, res, authOptions);
    const { query } = req;
    const { mediaId } = query;
    let communityId: string | null = Array.isArray(query.communityId)
      ? query.communityId[0]
      : query.communityId!;
    const mId: string = Array.isArray(mediaId) ? mediaId[0] : mediaId!;

    let slug = null;

    // if mediaId is not valid, then media does not exist
    if (!ObjectId.isValid(mId)) {
      throw new APIError("media does not exist", QueryError);
    }

    // if communityId it's not a valid object id, then it's a slug
    if (!ObjectId.isValid(communityId)) {
      slug = communityId;
      communityId = null;
    }

    // check permission
    const community = await prisma.community.findFirstOrThrow({
      where: {
        AND: [
          {
            OR: [{ id: communityId || undefined }, { slug: slug || undefined }],
          },
          { members: { some: { id: session!.user!.id } } },
        ],
      },
    });

    if (community) {
      const media = await prisma.media.findFirst({
        where: { id: mId },
      });

      return res.status(200).json({
        status: "success",
        data: {
          media,
        },
      });
    } else {
      throw new APIError("not authorized", UnauthorizedError);
    }
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      // Record Not Found
      if (e.code == "P2015") {
        throw new APIError("media does not exist");
      }

      throw new APIError(e.message, QueryError);
    }

    if (e instanceof PrismaClientValidationError) {
      throw new APIError(e.message, ValidationError);
    }

    throw e;
  }
}

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

    const { media } = await prisma.$transaction(async () => {
      // make sure user has permission
      // user is a member of the community
      const community = await prisma.community.findUnique({
        where: { id: cId },
      });

      const isMember = community?.memberIds.some(
        (id) => id === session!.user!.id
      );

      // user is a member but NOT the community owner
      if (isMember && community?.createdBy !== session!.user!.id) {
        // community members can only add to the queued list
        if (body.watched) {
          throw new APIError(
            "only the community owner can add to the watched list",
            UnauthorizedError
          );
        }
      } else if (!isMember) {
        throw new APIError(
          "must be a member of this community",
          UnauthorizedError
        );
      }

      const queueCount = await getQueueCount(cId);

      const watchedPropExists = body.hasOwnProperty("watched");
      const media = await prisma.media.update({
        where: {
          id: id,
        },
        data: {
          watched: body.watched,
          watchedAt: watchedPropExists ? new Date() : undefined,
          queue: watchedPropExists && !body.watched ? queueCount + 1 : null,
        },
      });

      return { media };
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
