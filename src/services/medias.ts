import { Media } from "@prisma/client";

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
