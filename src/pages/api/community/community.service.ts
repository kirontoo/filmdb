import { APIError, GenericError, QueryError, UnauthorizedError } from '@/lib/errors';
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

export const addUserToCommunity = async (inviteCode: string, memberId: string) => {
  return await prisma.$transaction(async tx => {
    const community = await tx.community.findUnique({
      where: {
        inviteCode
      },
      include: {
        members: true
      }
    });

    if (!community) {
      // could not find, invalid invite code
      throw new APIError("invalid invite code");
    }

    // check if user is already in the community
    const alreadyAMember = community.memberIds.some((id) => id === memberId);

    if (alreadyAMember) {
      throw new APIError('user is already a member of this community', GenericError);
    }

    const updatedCommunity = await tx.community
      .update({
        where: {
          inviteCode: inviteCode,
        },
        data: {
          members: {
            connect: [{ id: memberId }],
          },
        },
        include: { members: true },
      });

    return updatedCommunity;
  });
}

export const removeUserFromCommunity = async (communityId: string, userId: string) => {
  return await prisma.community.update({
    where: {
      id: communityId,
    },
    data: {
      members: {
        disconnect: [{ id: userId }]
      }
    }
  }).catch(_ => null)
}

// only returns a community if the user is a member
export const findCommunityWithSlugOrId = async (cId: string | null, slug: string | null, userId: string) => {
  return await prisma.community
    .findFirstOrThrow({
      where: {
        AND: [
          { OR: [{ id: cId || undefined }, { slug: slug || undefined }] },
          { members: { some: { id: userId } } },
        ],
      },
      include: {
        medias: {
          orderBy: {
            title: "asc",
          },
          include: {
            requestedBy: true,
          },
        },
        members: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    })
    .catch(() => {
      throw new APIError("community not found", QueryError);
    });
}

export const isCommunityOwner = async (
  cId: string | null,
  slug: string | null,
  userId: string,
): Promise<boolean> => {
  const c = await prisma.community.findFirst({
    where: {
      OR: [{ id: cId || undefined }, { slug: slug || undefined }],
      createdBy: userId
    },
  }).catch(_ => null);

  return c !== null ? true : false;
}

export const updateCommunity = async (
  cId: string,
  userId: string,
  data: { name?: string, description?: string }
) => {
  // user must be ther owner to be able to update
  await prisma.user.findFirstOrThrow({
    where: {
      AND: [
        {
          id: userId
        },
        {
          communities: {
            some: { AND: [{ id: cId }, { createdBy: userId }] },
          },
        },
      ],
    },
  }).catch(_ => { throw new APIError("not authorized", UnauthorizedError) })

  // generate new slug if community name change
  const slug = data.name
    ? slugify(data.name, { lower: true })
    : null;

  return await prisma.community.update({
    where: { id: cId },
    data: {
      name: data.name ?? undefined,
      description: data.description ?? undefined,
      slug: slug ?? undefined,
    },
  });
}
