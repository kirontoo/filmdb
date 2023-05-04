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
  post: createRating,
  get: getRatings,
  delete: deleteRating,
});

async function getRatings(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const { mediaId } = req.query;
    const mId: string = Array.isArray(mediaId) ? mediaId[0] : mediaId!;

    const ratings = await prisma.rating.findMany({
      where: {
        mediaId: mId,
      },
    });

    return res.status(200).json({
      status: "success",
      data: { ratings },
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

// POST /api/community/:communityId/media/:mediaId/rating
// body: { value: number }
async function createRating(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const session = await getServerSession(req, res, authOptions);
    const { query, body } = req;

    const { value } = body;
    if (!value) {
      throw new APIError("missing rate value", ValidationError);
    }

    const rateValue: number = Number(value);
    if (rateValue < 1 || rateValue > 5) {
      throw new APIError(
        "rate value should be between 1 and 5",
        ValidationError
      );
    }

    const { mediaId, communityId } = query;
    const mId: string = Array.isArray(mediaId) ? mediaId[0] : mediaId!;
    const cId: string = Array.isArray(communityId)
      ? communityId[0]
      : communityId!;

    const user = await prisma.user
      .findFirst({
        where: {
          email: session!.user!.email,
          communities: {
            some: { id: cId },
          },
        },
      })
      .catch(() => {
        throw new APIError(
          "must be a member of this community",
          UnauthorizedError
        );
      });

    if (user) {
      const data = await prisma.$transaction(async () => {
        const rating = await prisma.rating.create({
          data: {
            value: rateValue,
            user: {
              connect: { id: session!.user!.id },
            },
            media: {
              connect: { id: mId },
            },
            community: {
              connect: { id: cId },
            },
          },
        });

        const avg = await prisma.rating.aggregate({
          where: {
            mediaId: mId,
          },
          _avg: {
            value: true,
          },
        });

        const media = await prisma.media.update({
          where: { id: mId },
          data: {
            rating: avg._avg.value !== null ? avg._avg.value : undefined,
          },
        });

        return { rating, media };
      });

      return res.status(200).json({
        status: "success",
        data: {
          rating: { id: data.rating.id, value: data.rating.value },
          media: data.media,
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

// DELETE /api/community/:communityId/media/:mediaId/rating
async function deleteRating(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const session = await getServerSession(req, res, authOptions);

    const { mediaId } = req.query;
    const mId: string = Array.isArray(mediaId) ? mediaId[0] : mediaId!;


    const data = await prisma.$transaction(async () => {
      const rating = await prisma.rating.delete({
        where: {
          userId_mediaId: {
            userId: session!.user!.id,
            mediaId: mId,
          },
        },
      });

      const avg = await prisma.rating.aggregate({
        where: {
          mediaId: mId,
        },
        _avg: {
          value: true,
        },
      });

      const media = await prisma.media.update({
        where: { id: mId },
        data: {
          rating: avg._avg.value !== null ? avg._avg.value : undefined,
        },
      });

      return { rating, media };
    });

    return res.status(200).json({
      status: "success",
      data: {
        rating: { id: data.rating.id, value: data.rating.value },
        media: data.media,
      },
    });
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
