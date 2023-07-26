import { Footer, Navbar, NavSidebar, ProfileAside } from "@/components";
import { useLoadingContext } from "@/context/LoadingProvider";
import { useNavContext } from "@/context/NavProvider";
import {
  LoadingOverlay,
  AppShell,
  Navbar as Nav,
  Aside,
  MediaQuery,
  createStyles,
} from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { ReactNode } from "react";
import useIsDesktopDevice from "@/lib/hooks/useIsDesktopDevice";

interface LayoutProps {
  children: ReactNode;
}

const useStyles = createStyles(() => ({
  aside: {
    display: "none",
    background: "green",
  },
}));

export default function Layout({ children }: LayoutProps) {
  const { isLoading } = useLoadingContext();
  const {
    openedNavSidebar,
    openedAsideSidebar,
  } = useNavContext();
  const { classes } = useStyles();
  const isDesktop = useIsDesktopDevice();

  return (
    <AppShell
      styles={{
        main: {
          flexGrow: 1,
          position: "relative",
          paddingLeft: "0 !important",
          paddingRight: "0 !important",
        },
      }}
      navbarOffsetBreakpoint="sm"
      asideOffsetBreakpoint="sm"
      navbar={
        <MediaQuery largerThan="lg" styles={{ display: "none" }}>
          <Nav
            hiddenBreakpoint="lg"
            hidden={!openedNavSidebar}
            width={{ sm: 300 }}
            zIndex={900}
          >
            <NavSidebar />
          </Nav>
        </MediaQuery>
      }
      aside={
        isDesktop && !openedAsideSidebar ? (
          <></>
        ) : (
          <Aside
            classNames={classes.aside}
            hidden={!openedAsideSidebar}
            width={{ sm: 300, lg: 300 }}
            zIndex={900}
          >
            <ProfileAside />
          </Aside>
        )
      }
      header={<Navbar />}
      footer={<Footer />}
    >
      <Notifications limit={5} position="top-right" zIndex={1500} />
      <LoadingOverlay visible={isLoading} overlayBlur={2} />
      {children}
      <div className="violet-fade" />
    </AppShell>
  );
}
