import { NextApiResponse, NextApiRequest } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import slugify from "slugify";

import prisma from "@/lib/prisma/client";
import { generateInviteCode } from "@/lib/util";
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";

import { createHandler } from "@/lib/api/handler";
import {
  APIError,
  QueryError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/errors";

export default createHandler({
  get: getCommunities,
  post: postCommunity,
});

async function postCommunity(req: NextApiRequest, res: NextApiResponse) {
  // find user id
  try {
    const session = await getServerSession(req, res, authOptions);
    const user = await prisma.user
      .findFirstOrThrow({
        where: {
          AND: [
            {
              id: session!.user!.id,
            },
            {
              communities: {
                some: {
                  members: { some: { id: session!.user!.id } },
                },
              },
            },
          ],
        },
      })
      .catch(() => {
        throw new APIError("not authorized", UnauthorizedError);
      });

    if (user) {
      const { name, description } = req.body;
      const inviteCode = generateInviteCode(5);
      // TODO: retry if slug already exists
      const slug = slugify(name, { lower: true });

      const community = await prisma.community.create({
        data: {
          name,
          createdBy: user.id,
          description: description ?? "",
          inviteCode,
          slug,
          members: {
            connect: [{ id: user.id }],
          },
        },
        include: {
          members: true,
        },
      });

      if (community) {
        return res.status(201).json({
          status: "success",
          data: { community },
        });
      }
    } else {
      return res.status(500).send({
        status: "error",
        message: "could not create new community",
      });
    }
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        if (e.meta!.target === "communities_name_key") {
          throw new APIError("community already exists", QueryError);
        }
      }
      throw new APIError(e.message, QueryError);
    }

    if (e instanceof PrismaClientValidationError) {
      throw new APIError(e.message, ValidationError);
    }

    throw e;
  }
}

async function getCommunities(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);
    const communities = await prisma.community.findMany({
      where: {
        members: {
          some: {
            id: session!.user!.id,
          },
        },
      },
      include: {
        members: {
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
        communities: JSON.parse(JSON.stringify(communities)),
      },
    });
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      throw new APIError("could not find communities");
    }

    if (e instanceof PrismaClientValidationError) {
      throw new APIError(e.message, ValidationError);
    }

    throw e;
  }
}
