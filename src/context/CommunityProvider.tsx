import { Community } from "@prisma/client";
import { useSession } from "next-auth/react";
import {
  useEffect,
  useState,
  useContext,
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useMemo,
} from "react";
import { useLoadingContext } from "./LoadingProvider";

export type CommunityWithMembers = {
  members: { name: string; image: string }[];
} & Community;

interface CommunityState {
  communities: CommunityWithMembers[];
  currentCommunity: CommunityWithMembers | null;
  currentCommunityIndex: number;
  isFetching: boolean;

  setCommunities: Dispatch<SetStateAction<CommunityWithMembers[]>>;
  setCurrentCommunityIndex: Dispatch<SetStateAction<number>>;
  setCurrentCommunity: (slug: string) => void;
  resetCommunityContext: () => void;
  addCommunity: (community: CommunityWithMembers) => void;
  updateCommunityInfo: (
    id: string,
    data: { name: string; description: string }
  ) => void;
}

export const CommunityContext = createContext<CommunityState>({
  communities: [],
  currentCommunity: null,
  currentCommunityIndex: -1,
  isFetching: false,
  setCommunities: () => null,
  addCommunity: () => null,
  setCurrentCommunityIndex: () => null,
  setCurrentCommunity: () => null,
  resetCommunityContext: () => null,
  updateCommunityInfo: () => null,
});

export const useCommunityContext = () => {
  let context = useContext(CommunityContext);
  if (context === undefined) {
    throw new Error(
      "useCommunityContext must be used within a CommunityProvider"
    );
  }
  return context;
};

export const useCommunityProvider = (): CommunityState => {
  const [communities, setCommunities] = useState<CommunityWithMembers[]>([]);
  const [currentCommunityIndex, setCurrentCommunityIndex] =
    useState<number>(-1);
  const { status } = useSession();
  const { setLoading } = useLoadingContext();
  const [isFetching, setIsFetching] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    if (status === "authenticated") {
      (async () => {
        try {
          let res = await fetch("/api/community");
          let { data } = await res.json();
          setCommunities(data.communities);
          if (data.communities.length > 0) {
            // set the default community after fetching
            setCurrentCommunityIndex(0);
          }
        } catch (e) {
          resetCommunityContext();
        } finally {
          setLoading(false);
          setIsFetching(false);
        }
      })();
    } else {
      resetCommunityContext();
      setLoading(false);
    }
  }, [status]);

  const setCurrentCommunity = (slug: string) => {
    const index = communities.findIndex((c) => c.slug == slug);
    if (index === -1) {
      throw new Error("community does not exist");
    }
    setCurrentCommunityIndex(index);
  };

  const currentCommunity = useMemo<CommunityWithMembers | null>(() => {
    if (communities.length === 0) {
      return null;
    }

    if (currentCommunityIndex === -1) {
      return null;
    }

    return communities[currentCommunityIndex];
  }, [currentCommunityIndex, communities]);

  const updateCommunityInfo = (
    id: string,
    data: { name: string; description: string }
  ) => {
    const index = communities.findIndex((c) => c.id === id);
    if (index === -1) {
      // don't update anything if it doesn't exist
      return;
    }
    let foundCommunity = communities[index];
    const newCommunityItems = communities.filter((c) => c.id !== id);

    // merge community data
    setCommunities([
      ...newCommunityItems.slice(0, index),
      { ...foundCommunity, name: data.name, description: data.description },
      ...newCommunityItems.slice(index),
    ]);
  };

  const resetCommunityContext = () => {
    setCommunities([]);
    setCurrentCommunityIndex(-1);
  };

  const addCommunity = (c: CommunityWithMembers) => {
    setCommunities((prev) => [...prev, c]);
  };

  return {
    communities,
    currentCommunity,
    currentCommunityIndex,
    setCommunities,
    setCurrentCommunityIndex,
    setCurrentCommunity,
    resetCommunityContext,
    isFetching,
    updateCommunityInfo,
    addCommunity,
  };
};

export const CommunityProvider = ({ children }: { children: ReactNode }) => {
  const value = useCommunityProvider();
  return (
    <CommunityContext.Provider value={value}>
      {children}
    </CommunityContext.Provider>
  );
};
