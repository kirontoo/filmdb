import "@/styles/globals.css";

import { AppProps } from "next/app";
import Head from "next/head";
import {
  MantineProvider,
  ColorSchemeProvider,
  ColorScheme,
} from "@mantine/core";
import { MediaProvider } from "@/context/MediaProvider";

import { SessionProvider } from "next-auth/react";
import { Layout } from "@/components";
import { useLocalStorage } from "@mantine/hooks";
import { ModalsProvider } from "@mantine/modals";
import { CommunityFormModal } from "@/components";
import { CommunityProvider } from "@/context/CommunityProvider";

export default function App(props: AppProps) {
  const { Component, pageProps } = props;

  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>({
    key: "mantine-color-scheme",
    defaultValue: "light",
    getInitialValueInEffect: true,
  });

  const toggleColorScheme = (value?: ColorScheme) =>
    setColorScheme(value || (colorScheme === "dark" ? "light" : "dark"));

  const modals = {
    communityForm: CommunityFormModal,
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
            theme={{ colorScheme }}
            withGlobalStyles
            withNormalizeCSS
          >
            <ModalsProvider modals={modals}>
              <CommunityProvider>
                <MediaProvider>
                  <Layout>
                    <Component {...pageProps} />
                  </Layout>
                </MediaProvider>
              </CommunityProvider>
            </ModalsProvider>
          </MantineProvider>
        </ColorSchemeProvider>
      </SessionProvider>
    </>
  );
}
