import { NextApiResponse, NextApiRequest } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

import prisma from "@/lib/prismadb";
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";
import { Media } from "@prisma/client";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (session) {
    // Signed in
    const { query, method, body } = req;

    switch (method) {
      case "POST":
        // query: api/community/[id]

        const { id } = query;
        if (!id) {
          return res.status(400).send({
            status: "fail",
            message: "missing id",
          });
        }

        if (!body) {
          return res.status(400).send({
            status: "fail",
            message: "missing data",
          });
        }

        try {
          const communityId: string = Array.isArray(id) ? id[0] : id;

          const user = await prisma.user.findFirstOrThrow({
            where: {
              email: session!.user!.email as string,
              communities: {
                some: { id: communityId },
              },
            },
            include: {
              communities: {
                where: {
                  id: communityId,
                },
                select: { id: true, medias: true },
              },
            },
          });

          if (user) {
            const { title, mediaType, posterPath, watched, tmdbId } = body;
            const medias: Media[] | null =
              user.communities[0]["medias"] ?? null;
            if (medias) {
              // this media has already been added,
              const foundMedia = medias.find((m) => m.tmdbId == String(tmdbId));
              if (foundMedia) {
                return res.status(200).json({
                  status: "success",
                  data: {
                    media: foundMedia,
                  },
                });
              }
            }

            const update = await prisma.media.create({
              data: {
                title: title as string,
                mediaType: mediaType as string,
                tmdbId: String(tmdbId),
                posterPath: posterPath as string,
                watched: (watched as boolean) ?? false,
                community: {
                  connect: { id: communityId },
                },
              },
            });

            return res.status(200).json({
              status: "success",
              data: {
                media: update,
              },
            });
          } else {
            return res.status(401).send({
              status: "error",
              message: "not a member of this community",
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
            message: "could not add media to community",
          });
        }
      default:
        res.setHeader("Allow", ["POST"]);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } else {
    // Not Signed in
    res.status(401).send({
      status: "error",
      message: "user must be logged in",
    });
  }

  res.end();
}
