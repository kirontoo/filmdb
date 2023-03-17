import { Footer, Navbar } from "@/components";
import { ReactNode } from "react";
import { NavLinkProp } from "./Navbar";

interface LayoutProps {
  children: ReactNode;
  links?: NavLinkProp[]
}

export default function Layout({ links, children }: LayoutProps) {
  return (
    <>
      <Navbar links={links} />
      <main className="main">{children}</main>
      <footer>
        <Footer />
      </footer>
    </>
  );
}
