import { NextApiResponse, NextApiRequest } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth].api";

import prisma from "@/lib/prisma/client";
import { PrismaClientKnownRequestError, PrismaClientValidationError } from "@prisma/client/runtime/library";
import { createHandler } from "@/lib/api/handler";
import { APIError, QueryError, ValidationError } from "@/lib/errors";
import { addUserToCommunity } from "./community.service";

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

    const updatedCommunity = await addUserToCommunity(inviteCode, session!.user!.id);

    if (updatedCommunity) {
      return res.status(200).json({
        status: "success",
        data: { community: updatedCommunity },
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
