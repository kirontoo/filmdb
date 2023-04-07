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
  addMedia: (data: Media) => void;
  updateMedias: (id: string, media: Media) => void;
}

export const MediaContext = createContext<MediaState>({
  medias: [],
  watchedMedia: [],
  queuedMedia: [],
  setMedias: () => null,
  addMedia: () => null,
  updateMedias: () => null,
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

  const addMedia = (data: Media) => {
    setMedias((prev) => [...prev, data]);
  };

  const watchedMedia = useMemo<Media[]>(() => {
    return medias.filter((m: Media) => m.watched);
  }, [medias]);

  const queuedMedia = useMemo<Media[]>(() => {
    return medias.filter((m) => !m.watched);
  }, [medias]);

  const updateMedias = (id: string, media: Media) => {
    const index = medias.findIndex((m) => m.id === id);
    if (index === -1) {
      // don't update anything if it doesn't exist
      return;
    }
    let foundMedia = medias[index];
    const newMediaItems = medias.filter((m) => m.id !== id);

    // merge media data
    setMedias([
      ...newMediaItems.slice(0, index),
      { ...foundMedia, ...media },
      ...newMediaItems.slice(index),
    ]);
  };

  return {
    medias,
    setMedias,
    queuedMedia,
    watchedMedia,
    addMedia,
    updateMedias,
  };
};

export const MediaProvider = ({ children }: { children: ReactNode }) => {
  let value = useMediaProvider();
  return (
    <MediaContext.Provider value={value}>{children}</MediaContext.Provider>
  );
};
