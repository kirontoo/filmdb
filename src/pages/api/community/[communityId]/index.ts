import { NextApiResponse, NextApiRequest } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

import prisma from "@/lib/prismadb";
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";
import { MediaType } from "@prisma/client";
import {
  APIError,
  QueryError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/errors";
import { apiHandler } from "@/lib/apiHandler";

export default apiHandler({
  get: getCommunityById,
  post: addMediaToCommunity,
  patch: updateCommunity,
});

async function getCommunityById(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const session = await getServerSession(req, res, authOptions);
    const communityId: string = Array.isArray(id) ? id[0] : id!;
    const community = await prisma.community
      .findFirstOrThrow({
        where: {
          id: communityId,
          members: {
            some: {
              id: session!.user!.id,
            },
          },
        },
        include: {
          medias: true,
          members: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      })
      .catch(() => {
        throw new Error("community not found");
      });
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
    const user = await prisma.user.findFirstOrThrow({
      where: {
        AND: [
          {
            email: session!.user!.email,
          },
          {
            communities: {
              some: { AND: [{ id }, { createdBy: session!.user!.id }] },
            },
          },
        ],
      },
    });

    if (user) {
      const updated = await prisma.community.update({
        where: { id },
        data: {
          name: req.body["name"] ?? undefined,
          description: req.body["description"] ?? undefined,
        },
      });

      if (updated) {
        return res.status(200).json({
          status: "success",
          data: { community: updated },
        });
      } else {
        throw new APIError("could not update community");
      }
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

async function addMediaToCommunity(req: NextApiRequest, res: NextApiResponse) {
  // add media to community lists
  // query: api/community/[id]

  const { communityId } = req.query;
  const { title, mediaType, posterPath, watched, tmdbId } = req.body;
  try {
    const session = await getServerSession(req, res, authOptions);
    const id: string = Array.isArray(communityId)
      ? communityId[0]
      : communityId!;

    const user = await prisma.user
      .findFirst({
        where: {
          email: session!.user!.email,
          communities: {
            some: { id: id },
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
      const media = await prisma.media.upsert({
        where: {
          tmdbId_communityId: {
            tmdbId: String(tmdbId),
            communityId: id,
          },
        },
        update: {
          watched: (watched as boolean) ?? undefined,
        },
        create: {
          title: title as string,
          mediaType: mediaType as MediaType,
          tmdbId: String(tmdbId),
          posterPath: posterPath as string,
          watched: (watched as boolean) ?? false,
          community: {
            connect: { id: id },
          },
        },
      });

      // const media = await prisma.media.create({
      //   data: {
      //     title: title as string,
      //     mediaType: mediaType as string,
      //     tmdbId: String(tmdbId),
      //     posterPath: posterPath as string,
      //     watched: (watched as boolean) ?? false,
      //     community: {
      //       connect: { id: communityId },
      //     },
      //   },
      // });

      return res.status(201).json({
        status: "success",
        data: {
          media: media,
        },
      });
    }
  } catch (e) {
    console.log(e);
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
