import { NextApiResponse, NextApiRequest } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth].api";
import * as CommunityService from "./community.service";

import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";

import { createHandler } from "@/lib/api/handler";
import {
  APIError,
  QueryError,
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

    const { name, description } = req.body;
    const community = await CommunityService.createCommunity(
      session!.user!.id,
      name,
      description
    );


    if (community) {
      return res.status(201).json({
        status: "success",
        data: { community },
      });
    }
    else {
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
    const communities = CommunityService.getCommunities(session!.user!.id);
  
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
