import { NextApiResponse, NextApiRequest } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

import prisma from "@/lib/prismadb";
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";
import { APIError, QueryError, ValidationError } from "@/lib/errors";

import { apiHandler } from "@/lib/apiHandler";

export default apiHandler({
  get: getMedias,
});

// query: /api/community/:communityId/media
async function getMedias(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const { query } = req;

    const session = await getServerSession(req, res, authOptions);

    const communityId: string = Array.isArray(query.communityId)
      ? query.communityId[0]
      : query.communityId!;

    const medias = await prisma.media.findMany({
      where: {
        communityId: communityId,
      },
      orderBy: {
        title: "asc",
      },
      include: {
        _count: {
          select: { ratings: true },
        },
        ratings: {
          where: {
            userId: session!.user!.id,
          },
        },
        comments: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return res.status(200).json({
      status: "success",
      data: {
        medias: medias,
      },
    });
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
