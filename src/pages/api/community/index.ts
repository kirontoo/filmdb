import { NextApiResponse, NextApiRequest } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

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

            const community = await prisma.community.create({
              data: {
                name,
                ownerId: user.id,
                description,
                inviteCode,
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
        res.status(501);
      default:
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } else {
    // Not Signed in
    res.status(401);
  }

  res.end();
}
