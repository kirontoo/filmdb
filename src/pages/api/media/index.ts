import { NextApiResponse, NextApiRequest } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
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
  get: getMedias,
});


// query: /api/media?community={community slug}
// query: /api/media?communityId={community id}
async function getMedias(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const session = await getServerSession(req, res, authOptions);
    const { query } = req;
    const community: string = Array.isArray(query.community)
      ? query.community[0]
      : query.community!;
    const communityId: string = Array.isArray(query.communityId)
      ? query.communityId[0]
      : query.communityId!;

    const c = await prisma.community.findFirst({
      where: {
        OR: [
          { id: communityId || undefined },
          { slug: community || undefined },
        ],
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
