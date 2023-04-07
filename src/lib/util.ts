import { Media } from "@prisma/client";
import { TMDBMedia } from "./types";

export function generateInviteCode(length: number): string {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

export async function addMediaToList(
  media: TMDBMedia,
  communityId: string,
  watched: boolean
) {
  const body = {
    ...media,
    tmdbId: media.id,
    mediaType: media.media_type,
    title: media.title ?? media.name ?? media.original_title,
    watched,
    posterPath: media.poster_path,
  };

  const res = await fetch(`/api/community/${communityId}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();

  return { res, data };
}

export async function updateMedia(media: Media): Promise<{
  res: Response;
  data: { status: string; data: { media: Media } };
}> {
  const res = await fetch(`/api/media/${media.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      watched: !media.watched,
    }),
  });

  const data = await res.json();
  return { res, data };
}
