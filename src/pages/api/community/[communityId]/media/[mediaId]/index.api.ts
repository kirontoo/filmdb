import { NextApiResponse, NextApiRequest } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth].api";

import prisma from "@/lib/prisma/client";
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
import { parseCommunityIdAndSlugFromQuery, parseMediaIdFromQuery } from "@/lib/api/util";
import { findMediaById, updateMediaData } from "@/pages/api/community/[communityId]/media/media.service";
import { isAMemberOfCommunity } from "@/pages/api/community/community.service";

export default createHandler({
  get: getMediaFromCommunity,
  delete: deleteMedia,
  patch: updateMedia,
});

// GET: /api/community/[communityId]/media/[mediaId]?slug={slug}
async function getMediaFromCommunity(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getServerSession(req, res, authOptions);
    const { communityId, slug } = parseCommunityIdAndSlugFromQuery(req.query);
    const mId = parseMediaIdFromQuery(req.query);

    // if media id is not valid, then media does not exist
    if (!mId) {
      throw new APIError("media does not exist", QueryError);
    }

    // check permission
    const isAMember = await isAMemberOfCommunity(
      communityId,
      slug,
      session!.user!.id
    );

    if (isAMember) {
      const media = findMediaById(mId);
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

// DELETE: /api/community/[communityId]/media/[mediaId]?slug={slug}
async function deleteMedia(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);

    const { communityId, slug } = parseCommunityIdAndSlugFromQuery(req.query);
    const mId = parseMediaIdFromQuery(req.query);

    // if media id is not valid, then media does not exist
    if (!mId) {
      throw new APIError("media does not exist", QueryError);
    }

    // check permission
    // TODO: only the requester OR the owner of community can delete
    const isAMember = await isAMemberOfCommunity(communityId, slug, session!.user!.id);

    if (isAMember) {
      const media = await prisma.media.delete({
        where: { id: mId },
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

// PATCH: /api/community/[communityId]/media/[mediaId]
// body: {
//  watched: boolean,
//  watchedAt: Date,
//  queue: number
// }
async function updateMedia(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { body } = req;
    const session = await getServerSession(req, res, authOptions);

    const { communityId } = parseCommunityIdAndSlugFromQuery(req.query);
    if (!communityId) {
      throw new APIError("community does not exist", QueryError);
    }

    const mId = parseMediaIdFromQuery(req.query);
    if (!mId) {
      throw new APIError("media does not exist", QueryError);
    }

    // TODO: validate media data
    const media = await updateMediaData(communityId, mId, session!.user!.id, body);
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
