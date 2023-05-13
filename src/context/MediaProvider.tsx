import { Media, Rating, Comment } from "@prisma/client";
import {
  useState,
  useContext,
  createContext,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";

export type MediaWithRatingAndComments = {
  ratings: Rating[];
  comments: Comment[];
} & Media;

interface MediaState {
  medias: MediaWithRatingAndComments[];
  setMedias: Dispatch<SetStateAction<MediaWithRatingAndComments[]>>;
  addMedia: (data: MediaWithRatingAndComments) => void;
  updateMedias: (id: string, media: MediaWithRatingAndComments) => void;
  removeMedia: (id: string) => void;
}

export const MediaContext = createContext<MediaState>({
  medias: [],
  setMedias: () => null,
  addMedia: () => null,
  updateMedias: () => null,
  removeMedia: () => null,
});

export const useMediaContext = () => {
  let context = useContext(MediaContext);
  if (context === undefined) {
    throw new Error("useMediaContext must be used within a MediaProvider");
  }
  return context;
};

export const useMediaProvider = () => {
  const [medias, setMedias] = useState<MediaWithRatingAndComments[]>([]);

  const addMedia = (data: MediaWithRatingAndComments) => {
    setMedias((prev) => [...prev, data]);
  };

  const updateMedias = (id: string, media: MediaWithRatingAndComments) => {
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

  const removeMedia = (id: string) => {
    const newMediaItems = medias.filter((m) => m.id !== id);
    setMedias([...newMediaItems]);
  };

  return {
    medias,
    setMedias,
    addMedia,
    updateMedias,
    removeMedia,
  };
};

export const MediaProvider = ({ children }: { children: ReactNode }) => {
  let value = useMediaProvider();
  return (
    <MediaContext.Provider value={value}>{children}</MediaContext.Provider>
  );
};
