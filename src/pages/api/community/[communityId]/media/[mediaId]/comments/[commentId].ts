import { NextApiResponse, NextApiRequest } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
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

export default createHandler({
  patch: updateComment,
  delete: deleteComment,
});

async function updateComment(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const session = await getServerSession(req, res, authOptions);
    const { commentId } = req.query;
    const cId: string = Array.isArray(commentId) ? commentId[0] : commentId!;
    const { body } = req.body;

    if (body === undefined || body === null) {
      throw new APIError("missing text value", ValidationError);
    }

    const comment = await prisma.comment.update({
      where: {
        userId_id: {
          id: cId,
          userId: session!.user!.id,
        },
      },
      data: {
        body: body,
        textBackup: body,
      },
    });

    return res.status(200).json({
      status: "success",
      data: {
        comment,
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

// ONLY THE OWNER OR THE COMMUNITY OWNER CAN DELETE
async function deleteComment(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const session = await getServerSession(req, res, authOptions);
    const { communityId, commentId } = req.query;
    const cmId: string = Array.isArray(commentId) ? commentId[0] : commentId!;
    const cId: string = Array.isArray(communityId)
      ? communityId[0]
      : communityId!;

    const data = await prisma.$transaction(async () => {
      const community = await prisma.community
        .findFirst({
          where: {
            AND: [
              { id: cId },
              { members: { some: { id: session!.user!.id } } },
            ],
          },
        })
        .catch(() => {
          throw new APIError("not authorized", UnauthorizedError);
        });

      const comment = await prisma.comment
        .findUnique({ where: { id: cmId } })
        .catch(() => {
          throw new APIError("not authorized", UnauthorizedError);
        });

      if (comment && community) {
        if (
          comment.userId == session!.user!.id ||
          community.createdBy == session!.user!.id
        ) {
          const deleted = await prisma.comment.update({
            where: {
              userId_id: {
                id: cmId,
                userId: session!.user!.id,
              },
            },
            data: {
              body: "[deleted]",
              deleted: true,
              deletedAt: new Date()
            },
          });
          return { comment: deleted };
        }
      }
      return null;
    });

    if (data) {
      return res.status(200).json({
        status: "success",
        data: {
          comment: data.comment,
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
