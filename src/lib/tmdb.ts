import { TMDBMedia } from "./types";

export const TMDB_API_BASE_URL = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_API_BASE_URL = "https://image.tmdb.org/t/p";

// NOTE: query assumes that it is already in URI encoded format
// TODO: URI encode query for valid url()s
export function buildTMDBQuery(path: string, query: string | null = null) {
  return `${TMDB_API_BASE_URL}/${path}?api_key=${
    process.env.NEXT_PUBLIC_TMDB_API_KEY
  }${query ? `&${query}` : ""}`;
}

export function buildTMDBImageURL(
  path: string | null,
  size: 342 | 500 = 342
): string {
  return path
    ? `${TMDB_IMAGE_API_BASE_URL}/w${size}/${path}`
    : "https://placeholder.pics/svg/350x500";
}

export function getTMDBShowcaseImageUrl(path: string, isDesktop = false) {
  return `${TMDB_IMAGE_API_BASE_URL}/${isDesktop ? "w1280" : "w500"}/${path}`;
}

export function getTitle(m: TMDBMedia): string {
  return m.title ?? m.name ?? m.original_title ?? m.original_name;
}
