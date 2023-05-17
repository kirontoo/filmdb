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
  get: getComments,
  post: createComment,
});

async function getComments(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const { mediaId } = req.query;
    const mId: string = Array.isArray(mediaId) ? mediaId[0] : mediaId!;

    const comments = await prisma.comment.findMany({
      where: {
        mediaId: mId,
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    return res.status(200).json({
      status: "success",
      data: {
        comments,
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

async function createComment(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const session = await getServerSession(req, res, authOptions);
    const { communityId, mediaId } = req.query;
    const mId: string = Array.isArray(mediaId) ? mediaId[0] : mediaId!;
    const { body, parentId } = req.body;
    const cId: string = Array.isArray(communityId)
      ? communityId[0]
      : communityId!;

    if (body === undefined || body === null) {
      throw new APIError("missing text value", ValidationError);
    }

    const community = await prisma.community
      .findFirst({
        where: {
          AND: [{ id: cId }, { members: { some: { id: session!.user!.id } } }],
        },
      })
      .catch(() => {
        throw new APIError("not authorized", UnauthorizedError);
      });

    if (community) {
      const data = {
        user: { connect: { id: session!.user!.id } },
        media: { connect: { id: mId } },
        body: body,
      };

      if (parentId !== undefined && parentId !== null) {
        Object.assign(data, { parent: { connect: { id: parentId } } });
      }

      const comment = await prisma.comment.create({
        data: {
          ...data,
        },
        include: {
          media: true,
          user: { select: { name: true, image: true } },
          parent: true,
        },
      });

      return res.status(201).json({
        status: "success",
        data: {
          comment,
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
