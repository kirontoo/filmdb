import {
  Anchor,
  Stack,
  Text,
  Button,
  createStyles,
  Image,
  Container,
  Flex,
} from "@mantine/core";
import Link from "next/link";
import { buildTMDBImageURL, buildTMDBQuery } from "@/lib/tmdb";
import { TMDBMedia } from "@/lib/types";
import Head from "next/head";
import { GetServerSidePropsContext, NextPage } from "next";
import { CommunityMenu, NothingFoundBackground } from "@/components";
import { useSession } from "next-auth/react";
import { CommunityMenuActionProps } from "@/components/CommunityMenu";
import Notify from "@/lib/notify";
import { useState } from "react";

const useStyles = createStyles((theme) => ({
  addBtn: {
    textTransform: "uppercase",
    "@media (min-width: 62em)": {
      width: "fit-content",
    },
  },
  infoContainer: {
    width: "100%",
  },
  imgContainer: {
    maxWidth: "350px",
    width: "100%",
    margin: "auto",
    [`@media (min-width:${theme.breakpoints.md})`]: {
      margin: 0,
    },
  },
}));

interface MediaProps {
  media?: TMDBMedia;
}

const Media: NextPage<MediaProps> = ({ media }: MediaProps) => {
  const { classes } = useStyles();
  const { status } = useSession();
  const [loadingQueueBtn, setLoadingQueueBtn] = useState<boolean>(false);
  const [loadingWatchedBtn, setLoadingWatchedBtn] = useState<boolean>(false);

  const addToList = async (
    media: TMDBMedia,
    community: CommunityMenuActionProps,
    watched: boolean
  ) => {
    if (watched) {
      setLoadingWatchedBtn(true);
    } else {
      setLoadingQueueBtn(true);
    }

    try {
      const body = {
        ...media,
        tmdbId: media.id,
        mediaType: media.media_type,
        title: media.title ?? media.name ?? media.original_title,
        watched,
        posterPath: media.poster_path,
        backdropPath: media.backdrop_path
      };

      const res = await fetch(`/api/community/${community.id}`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const { message } = await res.json();

      if (res.ok) {
        Notify.success(
          `${community.name}`,
          `${body.title} was added to ${
            watched ? "watched list" : "queued list"
          }`
        );
      } else {
        Notify.error(`${community.name}`, `${message}`);
      }
    } catch (e) {
      Notify.error(
        `${
          media.title ?? media.name ?? media.original_title
        } could not be added to ${community.name}`,
        "Please try again"
      );
    } finally {
      if (watched) {
        setLoadingWatchedBtn(false);
      } else {
        setLoadingQueueBtn(false);
      }
    }
  };

  return (
    <>
      <Head>
        <title>FilmDB | {`${media?.name ?? media?.title}`}</title>
      </Head>
      <Container size="xl">
        <>
          {media ? (
            <Flex
              gap="md"
              justify="flex-start"
              align="flex-start"
              direction={{ base: "column", lg: "row" }}
            >
              <div className={classes.imgContainer}>
                <Image
                  src={buildTMDBImageURL(media?.poster_path)}
                  alt={`${media?.title ?? media?.name} poster`}
                  radius="md"
                />
              </div>

              <Stack spacing="sm">
                <Text fz="xl" component="h1">
                  {media?.title ?? media?.name}
                </Text>
                <Text component="h3">
                  {media?.release_date ??
                    media?.first_air_date ??
                    "Release Date: N/A"}
                </Text>
                <Text component="p">{media?.overview}</Text>
                <Flex gap="sm">
                  {status !== "authenticated" && (
                    <Anchor component={Link} href="/api/auth/signin">
                      Log in to add{" "}
                      {media.media_type == "tv" ? "tv show" : media.media_type}{" "}
                      to list
                    </Anchor>
                  )}
                  {status == "authenticated" && (
                    <>
                      <CommunityMenu
                        menuAction={(c: CommunityMenuActionProps) =>
                          addToList(media, c, false)
                        }
                      >
                        <Button
                          className={classes.addBtn}
                          loading={loadingQueueBtn}
                        >
                          Add to queue
                        </Button>
                      </CommunityMenu>
                      <CommunityMenu
                        menuAction={(c: CommunityMenuActionProps) =>
                          addToList(media, c, true)
                        }
                      >
                        <Button
                          className={classes.addBtn}
                          loading={loadingWatchedBtn}
                        >
                          Add to watchedlist
                        </Button>
                      </CommunityMenu>
                    </>
                  )}
                </Flex>
              </Stack>
            </Flex>
          ) : (
            <NothingFoundBackground />
          )}
        </>
      </Container>
    </>
  );
};

export async function getServerSideProps({ query }: GetServerSidePropsContext) {
  const slug = query.slug;
  const url = buildTMDBQuery(`${slug![0]}/${slug![1]}`);
  const dataRes = await fetch(url);
  const data = await dataRes.json();
  data.media_type = slug![0];

  if (data.success == false || !dataRes.ok) {
    return {
      redirect: {
        destination: "/404",
      },
    };
  }

  return {
    props: {
      media: data,
    },
  };
}

export default Media;
