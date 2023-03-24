import { useRouter } from "next/router";
import {
  Menu,
  Stack,
  Text,
  Button,
  createStyles,
  Image,
  Container,
  Flex,
} from "@mantine/core";
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
  },
}));

interface MediaProps {
  media?: MediaType;
  communities?: { name: string; slug: string; id: string }[];
}

const Media: NextPage<MediaProps> = ({ media, communities }: MediaProps) => {
  const router = useRouter();
  const { classes } = useStyles();
  const { addToWatchedMedia } = useMediaContext();

  const addToWatchedList = async (media: MediaType, communityId: string) => {
    const body = {
      ...media,
      tmdbId: media.id,
      mediaType: media.media_type,
      title: media.title ?? media.name,
      watched: true
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

  const addToQueue = (media: MediaType) => { };

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
                {status == "authenticated" && (
                  <Flex gap="sm">
                    <Button
                      className={classes.addBtn}
                      variant="subtle"
                      onClick={() => addToQueue(media)}
                    >
                      Add to queue
                    </Button>
                    {communities && (
                      <Menu shadow="md" width={200} trigger="hover">
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
                              onClick={() => addToWatchedList(media, c.id)}
                            >
                              {c.name}
                            </Menu.Item>
                          ))}
                        </Menu.Dropdown>
                      </Menu>
                    )}
                  </Flex>
                )}
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
    if (res) {
      res.writeHead(307, { Location: "/404" });
      res.end();
    }
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
