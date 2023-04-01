import { Media } from "@prisma/client";
import {
  useState,
  useContext,
  createContext,
  ReactNode,
  Dispatch,
  SetStateAction,
  useMemo,
} from "react";

interface MediaState {
  medias: Media[];
  watchedMedia: Media[];
  queuedMedia: Media[];
  setMedias: Dispatch<SetStateAction<Media[]>>;
  addToWatchedMedia: (data: Media) => void;
}

export const MediaContext = createContext<MediaState>({
  medias: [],
  watchedMedia: [],
  queuedMedia: [],
  setMedias: () => null,
  addToWatchedMedia: (data: Media) => null,
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

  const addToWatchedMedia = (data: Media) => {
    setMedias((prev) => [...prev, data]);
  };

  const watchedMedia = useMemo<Media[]>(() => {
    return medias.filter((m: Media) => m.watched);
  }, [medias]);

  const queuedMedia = useMemo<Media[]>(() => {
    return medias.filter((m) => !m.watched);
  }, [medias]);

  return {
    medias,
    setMedias,
    queuedMedia,
    watchedMedia,
    addToWatchedMedia,
  };
};

export const MediaProvider = ({ children }: { children: ReactNode }) => {
  let value = useMediaProvider();
  return (
    <MediaContext.Provider value={value}>{children}</MediaContext.Provider>
  );
};
