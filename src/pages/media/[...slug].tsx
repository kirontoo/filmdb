import {
  Anchor,
  Stack,
  Text,
  Button,
  Title,
  Group,
  createStyles,
  Image,
  Container,
  Flex,
  Badge,
  rem,
  Space,
} from "@mantine/core";
import format from "date-format";
import Link from "next/link";
import { buildTMDBQuery, getTMDBShowcaseImageUrl } from "@/lib/tmdb";
import { TMDBMedia } from "@/lib/types";
import Head from "next/head";
import { GetServerSidePropsContext, NextPage } from "next";
import { CommunityMenu, NothingFoundBackground } from "@/components";
import { useSession } from "next-auth/react";
import { CommunityMenuActionProps } from "@/components/CommunityMenu";
import Notify from "@/lib/notify";
import { useState } from "react";
import useIsDesktopDevice from "@/lib/hooks/useIsDesktopDevice";
import { formatDuration } from "@/lib/util";
import { IconPlus } from "@tabler/icons-react";

const useStyles = createStyles((theme) => ({
  mediaContainer: {
    padding: 0,
    [`@media (min-width: ${theme.breakpoints.md})`]: {
      paddingLeft: "1rem",
      paddingRight: "1rem",
    },
    [`@media (max-width: ${theme.breakpoints.md})`]: {
      marginBottom: "7rem",
    },
  },
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
    width: "100%",
    position: "relative",
    height: "60%",
    [`@media(min-width:${theme.breakpoints.md})`]: {
      height: "50%",
    },
    backgroundColor: theme.black,
  },

  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundImage:
      "radial-gradient(circle, rgba(0,0,0,0) 80%, rgba(0,0,0,0.7) 94%, rgba(0,0,0,1) 98%)",
    [`@media(min-width:${theme.breakpoints.md})`]: {
      backgroundImage:
        "radial-gradient(circle, rgba(0,0,0,0) 31%, rgba(0,0,0,0.6) 42%, rgba(0,0,0,1) 48%)",
    },
  },

  certification: {
    color: theme.colorScheme === "dark" ? theme.white : theme.black,
    borderColor: theme.colorScheme === "dark" ? theme.white : theme.black,
  },
}));

interface MediaProps {
  media: MediaWithCertifications;
}

interface MediaWithCertifications extends TMDBMedia {
  release_dates?: {
    results: Array<{
      iso_3166_1: string;
      release_dates: Array<{
        certification: string;
        descriptors: [];
        iso_639_1: string;
        note: string;
        release_date: string;
        type: number;
      }>;
    }>;
  };
  content_ratings: {
    results: Array<{
      descriptors: [];
      iso_3166_1: string;
      rating: string;
    }>;
  };
}

const Media: NextPage<MediaProps> = ({ media }: MediaProps) => {
  const { classes } = useStyles();
  const { status } = useSession();
  const [loadingQueueBtn, setLoadingQueueBtn] = useState<boolean>(false);
  const [loadingWatchedBtn, setLoadingWatchedBtn] = useState<boolean>(false);
  const isDesktop = useIsDesktopDevice();
  const isMovie = media.media_type === "movie";
  const certification = getCertifications(isMovie);

  function getCertifications(isMovie: boolean) {
    if (media) {
      let cert = isMovie
        ? media.release_dates!.results.find((d) => d.iso_3166_1 == "US")
            ?.release_dates[0].certification
        : media.content_ratings!.results.find((d) => d.iso_3166_1 == "US")
            ?.rating;
      if (cert && cert !== "") {
        return cert;
      }
    }
    return "No Rating";
  }

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
        backdropPath: media.backdrop_path,
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
        <title>FilmDB | {`${media.name ?? media.title}`}</title>
      </Head>
      <>
        {media ? (
          <>
            <div className={classes.imgContainer}>
              <Container>
                <Image
                  src={getTMDBShowcaseImageUrl(
                    isDesktop
                      ? (media.backdrop_path as string)
                      : (media.poster_path as string),
                    isDesktop
                  )}
                  alt={`${media.title ?? media.name} poster`}
                />
                <div className={classes.overlay} />
              </Container>
            </div>
            <Container className={classes.mediaContainer}>
              <Stack spacing="sm" p="1rem">
                <Title order={1}>{media.title ?? media.name}</Title>
                <div>
                  <Group position="apart">
                    <Group>
                      <Badge
                        variant="outline"
                        radius="xs"
                        className={classes.certification}
                      >
                        {certification}
                      </Badge>
                      <Text>
                        {media.release_date || media.first_air_date
                          ? format(
                              "yyyy",
                              new Date(
                                media.release_date ?? media.first_air_date
                              )
                            )
                          : "Release Date: N/A"}
                      </Text>
                      <Text>{isMovie && formatDuration(media.runtime!)}</Text>
                    </Group>

                    <Button
                      leftIcon={<IconPlus size={rem(16)} />}
                      size="sm"
                      compact
                    >
                      Add
                    </Button>
                  </Group>
                  <Space h="xs" />
                  <Text>{media.genres.map((g) => g.name).join(", ")}</Text>
                </div>
                <Text component="p">{media.overview}</Text>
                <Flex gap="sm">
                  {status !== "authenticated" && (
                    <Anchor component={Link} href="/api/auth/signin">
                      Log in to add {!isMovie ? "tv show" : media.media_type} to
                      list
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
            </Container>
          </>
        ) : (
          <NothingFoundBackground />
        )}
      </>
    </>
  );
};

export async function getServerSideProps({ query }: GetServerSidePropsContext) {
  const slug = query.slug;
  const queryStr = `append_to_response=${
    slug![0] === "movie" ? "release_dates" : "content_ratings"
  }`;
  const url = buildTMDBQuery(`${slug![0]}/${slug![1]}`, queryStr);
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
