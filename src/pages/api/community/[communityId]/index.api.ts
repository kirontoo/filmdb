import { NextApiResponse, NextApiRequest } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth].api";
import * as CommunityService from '@/pages/api/community/community.service';

import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";
import {
  APIError,
  QueryError,
  ValidationError,
} from "@/lib/errors";
import { createHandler } from "@/lib/api/handler";
import { ObjectId } from "bson";
import { createMediaAndAddToCommunity } from "./media/media.service";

export default createHandler({
  get: getCommunityById,
  post: addMediaToCommunity,
  patch: updateCommunity,
});

async function getCommunityById(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { communityId } = req.query;
    const session = await getServerSession(req, res, authOptions);

    let cId: string | null = Array.isArray(communityId)
      ? communityId[0]
      : communityId!;

    let slug = null;
    // if it's not a valid object id, then it's a slug
    if (!ObjectId.isValid(cId)) {
      slug = cId;
      cId = null;
    }

    const community = await CommunityService.findCommunityWithSlugOrId(
      cId,
      slug,
      session!.user!.id
    );

    if (community) {
      res.status(200).json({
        status: "success",
        data: {
          community,
        },
      });
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

async function updateCommunity(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { communityId } = req.query;
    const id: string = Array.isArray(communityId)
      ? communityId[0]
      : communityId!;
    const session = await getServerSession(req, res, authOptions);

    const updated = await CommunityService.updateCommunity(
      id,
      session!.user!.id,
      {
        name: req.body["name"],
        description: req.body["description"],
      }
    );

    if (updated) {
      return res.status(200).json({
        status: "success",
        data: { community: updated },
      });
    } else {
      throw new APIError("could not update community");
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


// add media to community lists
// query: api/community/[id]
async function addMediaToCommunity(req: NextApiRequest, res: NextApiResponse) {
  const { communityId } = req.query;
  const { title, mediaType, posterPath, backdropPath, watched, tmdbId } =
    req.body;
  try {
    const session = await getServerSession(req, res, authOptions);
    const cId: string = Array.isArray(communityId)
      ? communityId[0]
      : communityId!;

    const media = createMediaAndAddToCommunity(cId, session!.user!.id, req.body);

    return res.status(201).json({
      status: "success",
      data: {
        media: media,
      },
    });
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      const target = e.meta!["target"];
      if (target == "medias_tmdbId_communityId_key") {
        throw new APIError(`${title} has already been added`, QueryError);
      }

      throw new APIError(`${title} could not be added`);
    }

    if (e instanceof PrismaClientValidationError) {
      throw new APIError(e.message, ValidationError);
    }

    return res.status(500).send({
      status: "error",
      message: "could not add media to community",
    });
  }
}
