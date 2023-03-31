import { NextApiResponse, NextApiRequest } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import slugify from "slugify";

import prisma from "@/lib/prismadb";
import { generateInviteCode } from "@/lib/util";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  const session = await getServerSession(req, res, authOptions);

  if (session) {
    // Signed in
    const { body, method } = req;

    switch (method) {
      case "POST":
        // find user id
        try {
          const user = await prisma.user.findUnique({
            where: {
              email: session!.user!.email as string,
            },
          });

          if (user) {
            const { name, description } = body;
            const inviteCode = generateInviteCode(5);
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
          console.log(e);
          if (e instanceof PrismaClientKnownRequestError) {
            if (e.code === "P2002") {
              if (e.meta!.target === "communities_name_key") {
                return res.status(400).send({
                  status: "fail",
                  message: "community already exists",
                });
              }
            }
          }

          return res.status(500).send({
            status: "error",
            message: "could not create new community",
          });
        }
      case "GET":
        return getCommunities(req, res, session!.user!.email as string);
      default:
        res.setHeader("Allow", ["GET", "POST"]);
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

const getCommunities = async (
  req: NextApiRequest,
  res: NextApiResponse,
  email: string
) => {
  try {
    const communities = await prisma.community.findMany({
      where: {
        members: {
          some: {
            email: email,
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
    console.log(e);
    return res.status(500).send({
      status: "error",
      message: "could not find communities",
    });
  }
};
