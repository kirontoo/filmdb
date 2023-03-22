import { NextApiResponse, NextApiRequest } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

import prisma from "@/lib/prismadb";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (session) {
    // Signed in
    const { query, method } = req;

    switch (method) {
      case "POST":
        // query: api/community/join?code=some_code
        try {
          const { inviteCode: code } = query;
          if (!code) {
            return res.status(400).send({
              status: "fail",
              message: "invalid code",
            });
          }

          const user = await prisma.user.findUnique({
            where: {
              email: session!.user!.email as string,
            },
            include: {
              communities: {
                select: { inviteCode: true },
              },
            },
          });

          if (user) {
            const inviteCode = Array.isArray(code) ? code[0] : code;

            // check if user is already in the community
            const foundCommunity = user.communities.find(
              (c) => c.inviteCode === inviteCode
            );
            if (foundCommunity) {
              return res.status(403).send({
                status: "fail",
                message: "user is already a member of this community",
              });
            }

            // add user to community
            const community = await prisma.community.update({
              where: {
                inviteCode: inviteCode,
              },
              data: {
                members: {
                  connect: [{ id: user.id }],
                },
              },
            });

            if (community) {
              return res.status(200).json({
                status: "success",
                data: { community },
              });
            }
          }
        } catch (e) {
          console.log(e);
          if (e instanceof PrismaClientKnownRequestError) {
            return res.status(400).send({
              status: "fail",
              message: e.message,
            });
          }

          return res.status(500).send({
            status: "error",
            message: "could not add user to community",
          });
        }
      default:
        res.setHeader("Allow", ["POST"]);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } else {
    // Not Signed in
    res.status(401);
  }

  res.end();
}
