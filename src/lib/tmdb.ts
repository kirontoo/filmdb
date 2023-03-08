import { TMDB_API_BASE_URL } from ".";

// NOTE: query assumes that it is already in URI encoded format
// TODO: URI encode query for valid url()s
export function buildTMDBQuery(path: string, query: string | null = null) {
  return `${TMDB_API_BASE_URL}/${path}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY
    }${query ? `&${query}` : ""}`;
}
