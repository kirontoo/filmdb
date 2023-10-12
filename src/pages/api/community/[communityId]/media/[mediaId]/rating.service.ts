import prisma from "@/lib/prisma/client";
import { PrismaTransactionClient } from "@/lib/prisma/types";

export function getRatingAvgOfMedia(tx: PrismaTransactionClient, mediaId: string) {
  return tx.rating.aggregate({
    where: {
      mediaId: mediaId,
    },
    _avg: {
      value: true,
    },
  });
}

export async function updateUserRating(mediaId: string, userId: string, value: number) {
  return await prisma.$transaction(async (tx) => {
    const rating = await tx.rating.update({
      where: {
        userId_mediaId: {
          userId: userId,
          mediaId: mediaId,
        },
      },
      data: {
        value,
      },
    });

    const avg = await getRatingAvgOfMedia(tx, mediaId);

    const media = await tx.media.update({
      where: { id: mediaId },
      data: {
        rating: avg._avg.value !== null ? avg._avg.value : undefined,
      },
      include: {
        _count: {
          select: { ratings: true },
        },
        ratings: {
          where: {
            userId: userId,
          },
        },
      },
    });

    return { rating, media };
  });
}

export async function deleteARatingFromMedia(mediaId: string, userId: string) {
  return await prisma.$transaction(async (tx) => {
    const rating = await tx.rating.delete({
      where: {
        userId_mediaId: {
          userId: userId,
          mediaId,
        },
      },
    });

    const avg = await getRatingAvgOfMedia(tx, mediaId);

    const media = await tx.media.update({
      where: { id: mediaId },
      data: {
        rating: avg._avg.value !== null ? avg._avg.value : undefined,
      },
    });

    return { rating, media };
  });

}
