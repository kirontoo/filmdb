import { Community, Media } from "@prisma/client";

export async function fetchMedias({
  slug,
}: {
  slug: string;
}): Promise<Media[]> {
  try {
    const res = await fetch(`/api/community/${slug}/media`);
    const data = await res.json();
    if (res.ok) {
      const medias = data.data.medias.sort((a: Media, b: Media) => {
        const qA = a.queue ?? 0;
        const qB = b.queue ?? 0;
        if (qA < qB) {
          return -1;
        }
        if (qA > qB) {
          return 1;
        }
        return 0;
      });
      return medias;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    return await Promise.reject(error ?? "Error");
  }
}

export type CommunityWithMedia = {
  medias: Media[];
  members: {
    name: string;
    image: string;
    id: string;
  }[];
} & Community;

export async function fetchCommunityWithMedia({
  slug,
}: {
  slug: string;
}): Promise<CommunityWithMedia> {
  try {
    const res = await fetch(`/api/community/${slug}`);
    const data = await res.json();
    if (res.ok) {
      const medias = data.data.community.medias.sort((a: Media, b: Media) => {
        const qA = a.queue ?? 0;
        const qB = b.queue ?? 0;
        if (qA < qB) {
          return -1;
        }
        if (qA > qB) {
          return 1;
        }
        return 0;
      });
      return {
        ...data.data.community,
        medias,
      };
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    return await Promise.reject(error ?? "Error");
  }
}

export async function updateMedia(media: Media): Promise<{
  res: Response;
  data: { status: string; data: { media: Media } };
}> {
  const res = await fetch(
    `/api/community/${media.communityId}/media/${media.id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        watched: media.watched,
      }),
    }
  );

  const data = await res.json();
  return { res, data };
}
