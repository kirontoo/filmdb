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
  const { query, method, body } = req;
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



  if (session) {
    // Signed in

    switch (method) {
      case "POST":
        // query: api/community/[id]

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
      case "PATCH":
        const communityId: string = Array.isArray(id) ? id[0] : id;
        return await updateCommunity(
          req,
          res,
          communityId,
          session!.user!.email as string
        );
      default:
        res.setHeader("Allow", ["POST", "PATCH"]);
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

const updateCommunity = async (
  req: NextApiRequest,
  res: NextApiResponse,
  communityId: string,
  email: string
) => {
  const { body } = req;
  try {
    const user = await prisma.user.findFirstOrThrow({
      where: {
        email: email,
        communities: {
          some: { id: communityId },
        },
      },
      include: {
        communities: {
          where: {
            id: communityId,
          },
          select: { id: true, name: true, description: true, createdBy: true },
        },
      },
    });

    if (user && user.communities[0].createdBy == user.id) {
      const { name, description } = user.communities[0];
      const updated = await prisma.community.update({
        where: {
          id: communityId,
        },
        data: {
          name: body["name"] ?? name,
          description: body["description"] ?? description ?? "",
        },
      });

      if (updated) {
        return res.status(200).json({
          status: "success",
          data: { community: updated },
        });
      }
    } else {
      return res.status(400).send({
        status: "error",
        message: "unauthorized",
      });
    }
  } catch (e) {
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
      message: "could not update community",
    });
  }
};
