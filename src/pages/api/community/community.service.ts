import prisma from '@/lib/prisma/client';
import { generateInviteCode } from "@/lib/util";
import slugify from 'slugify';

export const getCommunities = async (id: string) => {
  return await prisma.community.findMany({
    where: {
      members: {
        some: {
          id: id,
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
}

export const createCommunity = async (id: string, name: string, description?: string) => {
  // TODO: retry if duplicate inviteCode
  const inviteCode = generateInviteCode(5);
  const slug = slugify(name, { lower: true });

  return await prisma.community.upsert({
    where: {
      name
    },
    update: {
      name,
      description
    },
    create: {
      name: name,
      description: description ?? "",
      inviteCode,
      createdBy: id,
      slug,
      members: {
        connect: [{ id }]
      },
    }
  });
}
