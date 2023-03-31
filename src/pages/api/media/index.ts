import { NextApiResponse, NextApiRequest } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

import prisma from "@/lib/prismadb";
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  const { method } = req;
  if (session) {
    // Signed in

    switch (method) {
      case "GET":
        // query: /api/media/communityId={id}
        // query: /api/media/community={slug}

        await getMedias(req, res, session!.user!.email as string);
        break;
      default:
        res.setHeader("Allow", ["GET"]);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } else {
    // Not Signed in
    res.status(401).send({
      status: "error",
      message: "not authenticated",
    });
  }

  res.end();
}

const getMedias = async (
  req: NextApiRequest,
  res: NextApiResponse,
  email: string
) => {
  const { query } = req;
  const community: string = Array.isArray(query.community)
    ? query.community[0]
    : query.community!;
  const communityId: string = Array.isArray(query.communityId)
    ? query.communityId[0]
    : query.communityId!;

  try {
    // make sure user is a member of the community
    const user = await prisma.user.findFirstOrThrow({
      where: {
        email,
      },
      include: {
        communities: {
          where: {
            OR: [
              { id: communityId || undefined },
              { slug: community || undefined },
            ],
          },
          include: {
            medias: true,
          },
        },
      },
    });

    if (user && user.communities[0]) {
      return res.status(200).json({
        status: "success",
        data: {
          medias: user.communities[0].medias,
        },
      });
    } else {
      res.status(401).send({
        status: "error",
        message: "not authenticated",
      });
    }
  } catch (e) {
    console.log(e);
    if (e instanceof PrismaClientKnownRequestError) {
      return res.status(400).send({
        status: "fail",
        message: e.message,
      });
    }

    if (e instanceof PrismaClientValidationError) {
      return res.status(400).send({
        status: "fail",
        message: "missing data",
      });
    }

    return res.status(500).send({
      status: "error",
      message: "could not find media, missing query",
    });
  }
};
