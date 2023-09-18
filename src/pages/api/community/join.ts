import { NextApiResponse, NextApiRequest } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

import prisma from "@/lib/prisma/client";
import { PrismaClientKnownRequestError, PrismaClientValidationError } from "@prisma/client/runtime/library";
import { createHandler } from "@/lib/api/handler";
import { APIError, QueryError, ValidationError } from "@/lib/errors";

export default createHandler({
  post: joinCommunity,
});

async function joinCommunity(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);

    const { code } = req.query;
    if (!code) {
      throw new APIError("missing invite code");
    }

    const inviteCode = Array.isArray(code) ? code[0] : code;

    // make sure user isn't already in the community
    const community = await prisma.community.findFirst({
      where: {
        members: {
          some: { id: session!.user!.id },
        },
      },
    });

    if (community) {
      return res.status(403).send({
        status: "fail",
        message: "user is already a member of this community",
      });
    }

    // add user to community
    const updatedCommunity = await prisma.community
      .update({
        where: {
          inviteCode: inviteCode,
        },
        data: {
          members: {
            connect: [{ id: session!.user!.id }],
          },
        },
        include: { members: true },
      })
      .catch(() => {
        // invalid invite code
        throw new APIError("invalid invite code");
      });

    if (updatedCommunity) {
      return res.status(200).json({
        status: "success",
        data: { community },
      });
    }
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      throw new APIError(e.message, QueryError);
    }

    if (e instanceof PrismaClientValidationError) {
      throw new APIError(e.message, ValidationError);
    }

    throw new Error("could not add user to community");
  }
}
