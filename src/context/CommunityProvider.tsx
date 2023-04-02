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

type CommunityWithMembers = {
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
}

export const CommunityContext = createContext<CommunityState>({
  communities: [],
  currentCommunity: null,
  currentCommunityIndex: -1,
  isFetching: false,
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
        } catch (e) {
          setCommunities([]);
          setCurrentCommunityIndex(-1);
        } finally {
          setLoading(false);
          setIsFetching(false);
        }
      })();
    } else {
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
  }, [currentCommunityIndex]);

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
    isFetching,
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
