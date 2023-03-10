import {
  useState,
  useContext,
  createContext,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import { Media } from "@/lib/types";

interface MediaState {
  medias: Media[];
  watchedMedia: Media[];
  watchlist: Media[];
  setMedias: Dispatch<SetStateAction<Media[]>>;
}

export const MediaContext = createContext<MediaState>({
  medias: [],
  watchedMedia: [],
  watchlist: [],
  setMedias: () => null,
});

export const useMediaContext = () => {
  let context = useContext(MediaContext);
  if (context === undefined) {
    throw new Error("useMediaContext must be used within a MediaProvider");
  }
  return context;
};

export const useMediaProvider = () => {
  const [medias, setMedias] = useState<Media[]>([]);
  const [watchedMedia, setWatchedMedia] = useState<Media[]>([]);
  const [watchlist, setWatchlist] = useState<Media[]>([]);

  return {
    medias,
    setMedias,
    watchlist,
    watchedMedia,
  };
};

export const MediaProvider = ({ children }: { children: ReactNode }) => {
  let value = useMediaProvider();
  return (
    <MediaContext.Provider value={value}>{children}</MediaContext.Provider>
  );
};
