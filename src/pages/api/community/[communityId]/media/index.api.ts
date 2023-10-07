import { NextApiResponse, NextApiRequest } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth].api";

import prisma from "@/lib/prisma/client";
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";
import { APIError, QueryError, UnauthorizedError, ValidationError } from "@/lib/errors";

import { createHandler } from "@/lib/api/handler";
import { ObjectId } from "bson";
import { Media } from "@prisma/client";
import { findCommunityWithSlugOrId, isCommunityOwner } from "../../community.service";

export default createHandler({
  get: getMedias,
  patch: updateMedias,
});

// query: /api/comunity/:communityId/media
// communityId can be the community id OR the slug
async function getMedias(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const session = await getServerSession(req, res, authOptions);
    const { query } = req;
    let communityId: string | null = Array.isArray(query.communityId)
      ? query.communityId[0]
      : query.communityId!;

    let slug = null;

    // if it's not a valid object id, then it's a slug
    if (!ObjectId.isValid(communityId)) {
      slug = communityId;
      communityId = null;
    }

    const c = await findCommunityWithSlugOrId(communityId, slug, session!.user!.id);

    if (c) {
      return res.status(200).json({
        status: "success",
        data: {
          medias: c.medias,
        },
      });
    } else {
      throw new APIError("not authorized", UnauthorizedError);
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

/*
 * payload:
 * required: id, queue
 */
// NOTE: maybe move this to it's own endpoint since it's only for the
// queue order
async function updateMedias(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const session = await getServerSession(req, res, authOptions);
    const { query, body } = req;
    let communityId: string | null = Array.isArray(query.communityId)
      ? query.communityId[0]
      : query.communityId!;

    let slug = null;
    // TODO: no data validation
    const mediasToUpdate = body.medias;

    if (!mediasToUpdate) {
      throw new APIError("no data to update", QueryError);
    }

    // if it's not a valid object id, then it's a slug
    if (!ObjectId.isValid(communityId)) {
      slug = communityId;
      communityId = null;
    }

    // only the community owner can update the media
    const isOwner = await isCommunityOwner(communityId, slug, session!.user!.id);
    // update all media data
    if (isOwner) {
      const transaction = await prisma.$transaction(
        mediasToUpdate.map((m: Media) => {
          return prisma.media.update({
            where: {
              id: m.id,
            },
            data: {
              queue: m.queue || undefined,
            },
          });
        })
      );
      return res.status(200).json({
        status: "success",
        data: {
          medias: transaction,
        },
      });
    } else {
      throw new APIError("not authorized", UnauthorizedError);
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

