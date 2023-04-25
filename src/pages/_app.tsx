import "@/styles/globals.css";

import { AppProps } from "next/app";
import Head from "next/head";
import {
  MantineProvider,
  ColorSchemeProvider,
  ColorScheme,
  MantineTheme,
} from "@mantine/core";
import { MediaProvider } from "@/context/MediaProvider";

import { SessionProvider } from "next-auth/react";
import { Layout, MediaModal } from "@/components";
import { useLocalStorage } from "@mantine/hooks";
import { ModalsProvider } from "@mantine/modals";
import { CommunityFormModal } from "@/components";
import { CommunityProvider } from "@/context/CommunityProvider";
import { LoadingProvider } from "@/context/LoadingProvider";
import { ReactElement, ReactNode } from "react";
import { NextPage } from "next/types";

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

export default function App(props: AppPropsWithLayout) {
  const { Component, pageProps } = props;

  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>({
    key: "mantine-color-scheme",
    defaultValue: "dark",
    getInitialValueInEffect: true,
  });

  const toggleColorScheme = (value?: ColorScheme) =>
    setColorScheme(value || (colorScheme === "dark" ? "light" : "dark"));

  const modals = {
    communityForm: CommunityFormModal,
    media: MediaModal,
  };

  const getLayout = Component.getLayout || ((page) => <Layout>{page}</Layout>);

  const layout = getLayout(
    <ModalsProvider modals={modals}>
      <Component {...pageProps} />
    </ModalsProvider>
  );

  const theme = {
    globalStyles: (theme: MantineTheme) => ({
      "*, *::before, *::after": {
        boxSizing: "border-box",
      },

      body: {
        ...theme.fn.fontStyles(),
        backgroundColor:
          theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
        color:
          theme.colorScheme === "dark" ? theme.colors.dark[0] : theme.black,
        lineHeight: theme.lineHeight,
      },

      ".your-class": {
        backgroundColor: "red",
      },

      "#your-id > [data-active]": {
        backgroundColor: "pink",
      },
    }),
  };

  return (
    <>
      <Head>
        <title>FilmDB</title>
        <meta
          name="description"
          content="keep track of the media you've watched with your friends and rate them"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <SessionProvider session={pageProps.session}>
        <ColorSchemeProvider
          colorScheme={colorScheme}
          toggleColorScheme={toggleColorScheme}
        >
          <MantineProvider
            theme={{
              colorScheme,
              globalStyles: (theme: MantineTheme) => ({
                body: {
                  ...theme.fn.fontStyles(),
                  backgroundColor:
                    theme.colorScheme === "dark"
                      ? "rgba(0,0,0,1)"
                      : theme.white,
                },
              }),
            }}
            withGlobalStyles
            withNormalizeCSS
          >
            <LoadingProvider>
              <CommunityProvider>
                <MediaProvider>{layout}</MediaProvider>
              </CommunityProvider>
            </LoadingProvider>
          </MantineProvider>
        </ColorSchemeProvider>
      </SessionProvider>
    </>
  );
}
