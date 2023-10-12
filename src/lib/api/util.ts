import prisma from "@/lib/prisma/client";
import { ObjectId } from "bson";
import { NextApiRequest } from "next";
import { NextApiRequestQuery } from "next/dist/server/api-utils";
import { APIError, QueryError } from "../errors";

export async function getQueueCount(communityId: string): Promise<number> {
  const queueAggregate = await prisma.media.aggregate({
    where: {
      communityId: communityId,
      watched: false,
    },
    _count: {
      _all: true,
    },
  });

  return queueAggregate._count._all ?? 0;
}

export function parseCommunityIdAndSlugFromQuery(query: NextApiRequestQuery): { communityId: string | null, slug: string | null } {
  let communityId: string | null = Array.isArray(query.communityId)
    ? query.communityId[0]
    : query.communityId!;

  let slug = null;

  // if communityId it's not a valid object id, then it's a slug
  if (!ObjectId.isValid(communityId)) {
    slug = communityId;
    communityId = null;
  }

  return {
    communityId,
    slug
  };
}

export function parseMediaIdFromQuery(query: NextApiRequestQuery): string | null {
  const { mediaId } = query;
  const mId: string = Array.isArray(mediaId) ? mediaId[0] : mediaId!;

  // if mediaId is not valid, then media does not exist
  if (!ObjectId.isValid(mId)) {
    return null;
  }

  return mId;
}
