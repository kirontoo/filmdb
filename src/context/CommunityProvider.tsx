import { Community } from "@prisma/client";
import {
  useState,
  useContext,
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useMemo,
} from "react";

type CommunityWithMembers = {
  members: { name: string; image: string }[];
} & Community;

interface CommunityState {
  communities: CommunityWithMembers[];
  currentCommunity: CommunityWithMembers | null;
  currentCommunityIndex: number;

  setCommunities: Dispatch<SetStateAction<CommunityWithMembers[]>>;
  setCurrentCommunityIndex: Dispatch<SetStateAction<number>>;
  setCurrentCommunity: (slug: string) => void;
  resetCommunityContext: () => void;
}

export const CommunityContext = createContext<CommunityState>({
  communities: [],
  currentCommunity: null,
  currentCommunityIndex: -1,
  setCommunities: () => null,
  setCurrentCommunityIndex: () => null,
  setCurrentCommunity: () => null,
  resetCommunityContext: () => null,
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
  }, [communities]);

  const resetCommunityContext = () => {
    setCommunities([]);
    setCurrentCommunityIndex(-1);
  };

  return {
    communities,
    currentCommunity,
    currentCommunityIndex,
    setCommunities,
    setCurrentCommunityIndex,
    setCurrentCommunity,
    resetCommunityContext,
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
