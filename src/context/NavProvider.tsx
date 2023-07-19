import { useDisclosure } from "@mantine/hooks";
import { useContext, createContext, ReactNode } from "react";

interface NavState {
  openedNavSidebar: boolean;
  navSidebarControls: UIControls;
  openedAsideSidebar: boolean;
  asideSidebarControls: UIControls;
}

interface UIControls {
  readonly open: () => void;
  readonly close: () => void;
  readonly toggle: () => void;
}

export const NavContext = createContext<NavState>({
  openedNavSidebar: false,
  navSidebarControls: {
    open: () => null,
    close: () => null,
    toggle: () => null,
  },
  openedAsideSidebar: false,
  asideSidebarControls: {
    open: () => null,
    close: () => null,
    toggle: () => null,
  },
});

export const useNavContext = () => {
  let context = useContext(NavContext);
  if (context === undefined) {
    throw new Error("useNavContext must be used within a NavProvider");
  }
  return context;
};

export const useNavProvider = () => {
  const [openedNavSidebar, navSidebarControls] = useDisclosure(false);
  const [openedAsideSidebar, asideSidebarControls] = useDisclosure(false);
  return {
    openedNavSidebar,
    navSidebarControls,
    openedAsideSidebar,
    asideSidebarControls,
  };
};

export const NavProvider = ({ children }: { children: ReactNode }) => {
  let value = useNavProvider();
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
};
