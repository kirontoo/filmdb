import {
  Anchor,
  Menu,
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
import { Media as MediaType } from "@/lib/types";
import { useMediaContext } from "@/context/MediaProvider";
import Head from "next/head";
import { GetServerSidePropsContext, NextPage } from "next";
import { NothingFoundBackground } from "@/components";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]";
import prisma from "@/lib/prismadb";
import { useSession } from "next-auth/react";

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
  media?: MediaType;
  communities?: { name: string; slug: string; id: string }[];
}

const Media: NextPage<MediaProps> = ({ media, communities }: MediaProps) => {
  const { classes } = useStyles();
  const { addToWatchedMedia } = useMediaContext();

  const addToList = async (
    media: MediaType,
    communityId: string,
    watched: boolean
  ) => {
    const body = {
      ...media,
      tmdbId: media.id,
      mediaType: media.media_type,
      title: media.title ?? media.name ?? media.original_title,
      watched,
      posterPath: media.poster_path,
    };

    const res = await fetch(`/api/community/${communityId}`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    if (res.ok) {
      addToWatchedMedia(media);
    }
  };
  const { status } = useSession();

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
                  {media?.release_date ?? "Release Date: N/A"}
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
                  {status == "authenticated" && communities && (
                    <>
                      <Menu
                        shadow="md"
                        width={200}
                        trigger="hover"
                        position="bottom-start"
                      >
                        <Menu.Target>
                          <Button className={classes.addBtn}>
                            Add to queue
                          </Button>
                        </Menu.Target>

                        <Menu.Dropdown>
                          <Menu.Label>Your Communities</Menu.Label>
                          {communities.map((c) => (
                            <Menu.Item
                              key={c.id}
                              onClick={() => addToList(media, c.id, false)}
                            >
                              {c.name}
                            </Menu.Item>
                          ))}
                        </Menu.Dropdown>
                      </Menu>
                      <Menu
                        shadow="md"
                        width={200}
                        trigger="hover"
                        position="bottom-start"
                      >
                        <Menu.Target>
                          <Button className={classes.addBtn}>
                            Add to watchedlist
                          </Button>
                        </Menu.Target>

                        <Menu.Dropdown>
                          <Menu.Label>Your Communities</Menu.Label>
                          {communities.map((c) => (
                            <Menu.Item
                              key={c.id}
                              onClick={() => addToList(media, c.id, true)}
                            >
                              {c.name}
                            </Menu.Item>
                          ))}
                        </Menu.Dropdown>
                      </Menu>
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

export async function getServerSideProps({
  req,
  res,
  query,
}: GetServerSidePropsContext) {
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

  const session = await getServerSession(req, res, authOptions);
  if (session) {
    const communities = await prisma.community.findMany({
      where: {
        members: {
          some: {
            email: session!.user!.email,
          },
        },
      },
      select: {
        name: true,
        slug: true,
        id: true,
      },
    });

    return {
      props: {
        media: data,
        communities: communities
          ? JSON.parse(JSON.stringify(communities))
          : null,
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
