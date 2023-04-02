import {
  useState,
  useContext,
  createContext,
  Dispatch,
  SetStateAction,
  ReactNode,
} from "react";

interface LoadingState {
  isLoading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
}

const LoadingContext = createContext<LoadingState>({
  isLoading: false,
  setLoading: () => null,
});

export const useLoadingContext = () => {
  let context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoadingContext must be used within a LoadingProvider");
  }
  return context;
};

const useLoadingProvider = () => {
  const [isLoading, setLoading] = useState<boolean>(false);
  return {
    isLoading,
    setLoading,
  };
};

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
  const value = useLoadingProvider();
  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  );
};
