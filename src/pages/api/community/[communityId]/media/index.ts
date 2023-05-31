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
import { ObjectId } from "bson";

export default apiHandler({
  get: getMedias,
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

    const c = await prisma.community.findFirst({
      where: {
        OR: [{ id: communityId || undefined }, { slug: slug || undefined }],
        members: {
          some: { id: session!.user!.id },
        },
      },
      include: {
        medias: {
          orderBy: {
            title: "asc",
          },
        },
      },
    });

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
