export interface Media {
  adult: boolean;
  backdrop_path: string | null;
  genre_ids: Array<number>;
  id: number;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  release_date: string | null;
  first_air_date: string | null;
  title: string;
  name: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
  media_type: string;
}

