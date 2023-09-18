import prisma from "@/lib/prisma/client";

export async function getQueueCount(communityId: string): Promise<number> {
  const queueAggregate = await prisma.media.aggregate({
    where: {
      communityId: communityId,
      watched: false,
    },
    _count: {
      _all: true,
    },
  });

  return queueAggregate._count._all ?? 0;
}
