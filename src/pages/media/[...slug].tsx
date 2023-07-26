import styles from "@/styles/MediaSlug.module.css";

import {
  Stack,
  Text,
  Title,
  Group,
  createStyles,
  Image,
  Container,
  Badge,
  Space,
  Divider,
  Menu,
  ActionIcon,
  Modal,
  UnstyledButton,
  Avatar,
  Loader,
  Center,
} from "@mantine/core";
import { buildTMDBQuery, getTMDBShowcaseImageUrl } from "@/lib/tmdb";
import { TMDBCast, TMDBCrew, TMDBMedia } from "@/lib/types";
import Head from "next/head";
import { GetServerSidePropsContext, NextPage } from "next";
import { AddMediaButton, NothingFoundBackground } from "@/components";
import { useSession } from "next-auth/react";
import { CommunityMenuActionProps } from "@/components/CommunityMenu";
import Notify from "@/lib/notify";
import { useState } from "react";
import useIsDesktopDevice from "@/lib/hooks/useIsDesktopDevice";
import { formatDuration } from "@/lib/util";
import {
  IconDotsVertical,
  IconHistory,
  IconPointFilled,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { useDisclosure } from "@mantine/hooks";
import { useCommunityContext } from "@/context/CommunityProvider";

const useStyles = createStyles((theme) => ({
  mediaContainer: {
    padding: 0,
    [`@media (min-width: ${theme.breakpoints.md})`]: {
      paddingLeft: "1rem",
      paddingRight: "1rem",
    },
    [`@media (max-width: ${theme.breakpoints.md})`]: {
      marginBottom: "4rem",
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
    backgroundColor: theme.black,
  },

  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    height: "100%",
    backgroundImage:
      "radial-gradient(circle, rgba(0,0,0,0) 80%, rgba(0,0,0,0.7) 94%, rgba(0,0,0,1) 98%)",
    [`@media(min-width:${theme.breakpoints.md})`]: {
      backgroundImage:
        "radial-gradient(circle, rgba(0,0,0,0) 25%, rgba(0,0,0,0.6) 38%, rgba(0,0,0,1) 48%)",
    },
  },

  communityBtn: {
    border: `1px solid ${theme.colors.gray[7]}`,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },

  menuDropdown: {
    backgroundColor: theme.colors.gray[9],
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
  credits: {
    cast: Array<TMDBCast>;
    crew: Array<TMDBCrew>;
  };
}

const Media: NextPage<MediaProps> = ({ media }: MediaProps) => {
  const director = media.credits.crew.find(
    (p) => p.known_for_department === "Directing"
  );
  const { classes } = useStyles();
  const { status } = useSession();
  const [loadingAddToList, setLoadingAddToList] = useState<boolean>(false);
  const { communities } = useCommunityContext();
  const isDesktop = useIsDesktopDevice();
  const isMovie = media.media_type === "movie";
  const certification = getCertifications(isMovie);
  const [openedCommunityModal, communityModalControls] = useDisclosure(false);

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
    try {
      setLoadingAddToList(true);
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

      if (res.ok) {
        Notify.success(
          `${community.name}`,
          `${body.title} was added to ${
            watched ? "watched list" : "queued list"
          }`
        );
      } else {
        throw new Error("could not add to list");
      }
    } catch (e) {
      Notify.error(
        `${
          media.title ?? media.name ?? media.original_title
        } could not be added to ${community.name}`,
        "Please try again"
      );
    } finally {
      setLoadingAddToList(true);
      communityModalControls.close();
    }
  };

  if (!media) {
    return <NothingFoundBackground />;
  }

  return (
    <>
      <Head>
        <title>{`${media.name ?? media.title}`} | FilmDB </title>
      </Head>
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
            <Group position="apart">
              <Title order={1}>{media.title ?? media.name}</Title>
              <Group>
                <AddMediaButton
                  media={media}
                  menuProps={{ position: "top-end" }}
                />

                {status == "authenticated" && (
                  <Menu position="top-end">
                    <Menu.Target>
                      <ActionIcon variant="outline" radius="xl">
                        <IconDotsVertical />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown className={classes.menuDropdown}>
                      <Menu.Item
                        icon={<IconHistory />}
                        onClick={communityModalControls.open}
                      >
                        Add to watched list
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                )}
              </Group>
            </Group>
            <Group spacing="sm">
              <Badge
                variant="outline"
                radius="xs"
                className={classes.certification}
              >
                {certification}
              </Badge>
              <IconPointFilled size="0.6rem" role="separator" />
              <Text>
                {media.release_date || media.first_air_date
                  ? dayjs(media.release_date ?? media.first_air_date).format(
                      "YYYY"
                    )
                  : "Release Date: N/A"}
              </Text>
              {isMovie && (
                <>
                  <IconPointFilled size="0.6rem" role="separator" />
                  <Text>{formatDuration(media.runtime!)}</Text>
                </>
              )}
            </Group>

            <Text>{media.genres.map((g) => g.name).join(", ")}</Text>
            <Space h="xs" />

            <Title order={2} fz="lg">
              Overview
            </Title>
            <Text component="p">{media.overview}</Text>

            <Divider />

            <Title order={2} fz="lg">
              Cast
            </Title>

            <ul className={styles.inlineList}>
              {media.credits.cast.map((p) => {
                return <li key={p.id}>{p.name}</li>;
              })}
            </ul>

            <Divider />

            <Title order={2} fz="lg">
              Director
            </Title>
            <Text>{director?.name || "N/A"}</Text>
          </Stack>
        </Container>

        <Modal
          opened={openedCommunityModal}
          onClose={communityModalControls.close}
          title="Commuunity"
          centered
        >
          <Stack>
            {loadingAddToList ? (
              <Center>
                <Loader />
              </Center>
            ) : (
              communities.map((c) => (
                <UnstyledButton
                  className={classes.communityBtn}
                  key={c.id}
                  onClick={() =>
                    addToList(media, { id: c.id, name: c.name }, true)
                  }
                >
                  <Avatar size="md" radius="lg">
                    {c.name[0].toUpperCase()}
                  </Avatar>
                  {c.name}
                </UnstyledButton>
              ))
            )}
          </Stack>
        </Modal>
      </>
    </>
  );
};

export async function getServerSideProps({ query }: GetServerSidePropsContext) {
  const slug = query.slug;
  const queryStr = `append_to_response=${
    slug![0] === "movie" ? "release_dates" : "content_ratings"
  },credits`;
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
