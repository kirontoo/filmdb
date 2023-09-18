import { NextApiResponse, NextApiRequest } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth].api";

import prisma from "@/lib/prisma/client";
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";
import { APIError, QueryError, ValidationError } from "@/lib/errors";
import { createHandler } from "@/lib/api/handler";

export default createHandler({
  post: leaveCommunity,
});

async function leaveCommunity(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);
    const { communityId } = req.query;
    const id: string = Array.isArray(communityId)
      ? communityId[0]
      : communityId!;

    const community = await prisma.user.update({
      where: {
        id: session!.user!.id,
      },
      data: {
        communities: {
          disconnect: [{ id: id }],
        },
      },
    });

    return res.status(200).json({
      status: "success",
      message: `removed user from community: ${community.name}`,
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
