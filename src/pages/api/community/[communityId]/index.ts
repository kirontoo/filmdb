import { NextApiResponse, NextApiRequest } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

import prisma from "@/lib/prismadb";
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";
import { MediaType } from "@prisma/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  const { query, method, body } = req;
  const { communityId } = query;
  if (!communityId) {
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
        // add media to community lists
        // query: api/community/[id]

        const { title, mediaType, posterPath, watched, tmdbId } = body;
        try {
          const id: string = Array.isArray(communityId)
            ? communityId[0]
            : communityId;

          const user = await prisma.user.findFirst({
            where: {
              email: session!.user!.email as string,
              communities: {
                some: { id: id },
              },
            },
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

            return res.status(200).json({
              status: "success",
              data: {
                media: media,
              },
            });
          } else {
            return res.status(403).send({
              status: "error",
              message: "must be a member of this community",
            });
          }
        } catch (e) {
          console.log(e);
          if (e instanceof PrismaClientKnownRequestError) {
            const target = e.meta!["target"];
            if (target == "medias_tmdbId_communityId_key") {
              return res.status(400).send({
                status: "fail",
                message: `${title} has already been added`,
              });
            }
            return res.status(400).send({
              status: "fail",
              message: `${title} could not be added`,
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
        const id: string = Array.isArray(communityId)
          ? communityId[0]
          : communityId;
        return await updateCommunity(
          req,
          res,
          id,
          session!.user!.email as string
        );
      case "GET":
        return await getCommunityById(req, res, session!.user!.email as string);
      default:
        res.setHeader("Allow", ["GET", "POST", "PATCH"]);
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

const getCommunityById = async (
  req: NextApiRequest,
  res: NextApiResponse,
  email: string
) => {
  const { query } = req;
  const { id } = query;
  try {
    const communityId: string = Array.isArray(id) ? id[0] : id!;
    const community = await prisma.community.findFirst({
      where: {
        id: communityId,
        members: {
          some: {
            email,
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
      return res.status(400).send({
        status: "fail",
        message: e.message,
      });
    }

    if (e instanceof PrismaClientValidationError) {
      return res.status(400).send({
        status: "fail",
        message: "community does not exist",
      });
    }

    return res.status(500).send({
      status: "error",
      message: "could not find community",
    });
  }
};

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
