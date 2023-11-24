import { Media, MediaType } from "@prisma/client";
import prisma from '@/lib/prisma/client';
import { APIError, UnauthorizedError } from "@/lib/errors";
import { getQueueCount } from "@/lib/api/util";


type MediaDataInput = {
  title: string
  mediaType: string
  posterPath: string
  backdropPath: string
  watched: boolean,
  tmdbId: string
};

/*
 * @param mediasToUpdate { id: string, queue: number }[]
 * @returns medias with updated media queue - not in order
*/
export async function updateMediaQueue(
  mediasToUpdate: Partial<Media>[]
) {
  return await prisma.$transaction(async tx => {
    mediasToUpdate.map((m: Partial<Media>) => {
      return tx.media.update({
        where: { id: m.id, },
        data: { queue: m.queue || undefined, }
      });
    })
  });
}

/*
 * @param cId - community id
 * @param mediaData - MediaDataInput
*/
export async function createMediaAndAddToCommunity(
  cId: string,
  userId: string,
  mediaData: MediaDataInput
) {
  const { title, mediaType, posterPath, backdropPath, watched, tmdbId } = mediaData;
  const media = await prisma.$transaction(async (tx) => {

    // find community
    const community = await tx.community.findUnique({
      where: { id: cId },
    });

    // is the user a member or the owner of the community
    const isMember = community?.memberIds.some(
      (id: string) => id === userId
    );

    // user is a member but NOT the community owner
    if (isMember && community?.createdBy !== userId) {
      // community members can only add to the watched list
      if (watched) {
        throw new APIError(
          "only the community owner can add to the watched list",
          UnauthorizedError
        );
      }
    } else if (!isMember) {
      throw new APIError(
        "must be a member of this community",
        UnauthorizedError
      );
    }

    const queueCount = await getQueueCount(cId);
    const watchedPropExists = mediaData.hasOwnProperty("watched");

    return await tx.media.upsert({
      where: {
        tmdbId_communityId: {
          tmdbId: String(tmdbId),
          communityId: cId,
        },
      },
      update: {
        watched: (watched as boolean) ?? undefined,
        watchedAt: watchedPropExists ? new Date() : undefined,
        queue: watchedPropExists && !mediaData.watched ? queueCount + 1 : null,
      },
      create: {
        title: title as string,
        mediaType: mediaType as MediaType,
        tmdbId: String(tmdbId),
        posterPath: posterPath as string,
        backdropPath: backdropPath as string,
        watched: (watched as boolean) ?? false,
        requestedBy: {
          connect: { id: userId },
        },
        community: {
          connect: { id: cId },
        },
      },
    });
  });

  return media;
}

export async function findMediaById(mediaId: string) {
  return await prisma.media.findFirst({
    where: { id: mediaId },
  });
}

export async function updateMediaData(
  communityId: string,
  mediaId: string,
  userId: string,
  data: MediaDataInput
) {
  return await prisma.$transaction(async (tx) => {
    // make sure user has permission
    // user is a member of the community
    const community = await tx.community.findUnique({
      where: { id: communityId },
    });

    const isMember = community?.memberIds.some(
      (id) => id === userId
    );

    // user is a member but NOT the community owner
    if (isMember && community?.createdBy !== userId) {
      // community members can only add to the queued list
      if (data.watched) {
        throw new APIError(
          "only the community owner can add to the watched list",
          UnauthorizedError
        );
      }
    } else if (!isMember) {
      throw new APIError(
        "must be a member of this community",
        UnauthorizedError
      );
    }

    const queueCount = await getQueueCount(communityId);
    const watchedPropExists = data.hasOwnProperty("watched");
    
    return await tx.media.update({
      where: {
        id: mediaId,
      },
      data: {
        watched: data.watched,
        watchedAt: watchedPropExists ? new Date() : undefined,
        queue: watchedPropExists && !data.watched ? queueCount + 1 : null,
      },
    });
  });
}
