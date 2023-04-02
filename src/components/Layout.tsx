import { Footer, Navbar } from "@/components";
import { useLoadingContext } from "@/context/LoadingProvider";
import { LoadingOverlay } from "@mantine/core";
import { ReactNode } from "react";
import { NavLinkProp } from "./Navbar";

interface LayoutProps {
  children: ReactNode;
  links?: NavLinkProp[];
}

export default function Layout({ links, children }: LayoutProps) {
  const { isLoading } = useLoadingContext();
  return (
    <>
      <Navbar links={links} />
      <main className="main">
        <LoadingOverlay visible={isLoading} overlayBlur={2} />
        {children}
      </main>
      <footer>
        <Footer />
      </footer>
    </>
  );
}
