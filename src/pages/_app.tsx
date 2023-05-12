import "@/styles/globals.css";

import { AppProps } from "next/app";
import Head from "next/head";
import {
  MantineProvider,
  ColorSchemeProvider,
  ColorScheme,
  MantineTheme,
  LoadingOverlay,
} from "@mantine/core";
import { MediaProvider } from "@/context/MediaProvider";

import { SessionProvider, useSession } from "next-auth/react";
import { Layout, MediaModal } from "@/components";
import { useLocalStorage } from "@mantine/hooks";
import { ModalsProvider } from "@mantine/modals";
import { CommunityFormModal } from "@/components";
import { CommunityProvider } from "@/context/CommunityProvider";
import { LoadingProvider } from "@/context/LoadingProvider";
import { ReactElement, ReactNode } from "react";
import { NextPage } from "next/types";
import { useRouter } from "next/router";

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
  auth?: AuthProps | boolean;
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
      {Component.auth ? (
        <Auth auth={Component.auth}>
          <Component {...pageProps} />
        </Auth>
      ) : (
        <Component {...pageProps} />
      )}
    </ModalsProvider>
  );

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
            withGlobalStyles
            withNormalizeCSS
            theme={{
              colorScheme,
              globalStyles: (theme: MantineTheme) => ({
                colors: { ...theme.colors },
                body: {
                  ...theme.fn.fontStyles(),
                  color:
                    theme.colorScheme === "dark" ? theme.white : theme.black,
                  backgroundColor:
                    theme.colorScheme === "dark"
                      ? "rgba(0,0,0,1)"
                      : theme.white,
                },
                primaryColor: "violet",
                primaryShade: { light: 5, dark: 7 },
              }),
            }}
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

interface AuthProps {
  loading?: ReactElement;
  unauthorized?: string; // url
}

function Auth({
  children,
  auth,
}: {
  auth: AuthProps | boolean;
  children: ReactElement;
}) {
  // if `{ required: true }` is supplied, `status` can only be "loading" or "authenticated"
  const router = useRouter();
  const { status } = useSession({
    required: true,
    onUnauthenticated: () => {
      if (typeof auth !== "boolean" && auth.unauthorized) {
        router.push(auth.unauthorized);
      } else {
        router.push("/404");
      }
    },
  });

  if (status === "loading") {
    if (typeof auth !== "boolean" && auth.loading) {
      return auth.loading;
    }
    return <LoadingOverlay visible={true} />;
  }

  return children;
}
