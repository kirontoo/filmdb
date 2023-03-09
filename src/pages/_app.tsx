import "@/styles/globals.css";

import { AppProps } from "next/app";
import Head from "next/head";
import { MantineProvider } from "@mantine/core";
import { MovieProvider } from "@/context/MovieProvider";
import { LoginBtn } from '@/components';

import { SessionProvider } from "next-auth/react";

export default function App(props: AppProps) {
  const { Component, pageProps } = props;

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
        <MantineProvider withGlobalStyles withNormalizeCSS>
          <MovieProvider>
          <LoginBtn/>
            <Component {...pageProps} />
          </MovieProvider>
        </MantineProvider>
      </SessionProvider>
    </>
  );
}
