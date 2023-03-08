import {
  useState,
  useContext,
  createContext,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import { Movie } from "@/lib/types";

interface MovieState {
  movies: Movie[];
  setMovies: Dispatch<SetStateAction<Movie[]>>;
}

export const MovieContext = createContext<MovieState>({
  movies: [],
  setMovies: () => null,
});

export const useMovieContext = () => {
  let context = useContext(MovieContext);
  if (context === undefined) {
    throw new Error("useMovieContext must be used within a MovieProvider");
  }
  return context;
};

export const useMovieProvider = () => {
  const [movies, setMovies] = useState<Movie[]>([]);

  return {
    movies,
    setMovies,
  };
};

export const MovieProvider = ({ children }: { children: ReactNode }) => {
  let value = useMovieProvider();
  return (
    <MovieContext.Provider value={value}>{children}</MovieContext.Provider>
  );
};
