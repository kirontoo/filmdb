import { useRouter } from "next/router";
import {
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
import { NextPage } from "next";
import { NothingFoundBackground } from "@/components";

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
  media: MediaType;
}
const Media: NextPage<MediaProps> = ({ media }: MediaProps) => {
  const router = useRouter();
  const slug = (router.query.slug as string[]) || [];
  const { classes } = useStyles();
  const { addToWatchedMedia } = useMediaContext();
  const addToWatchedList = (media: MediaType) => {
    media.media_type = slug[0];
    addToWatchedMedia(media);
  };

  return (
    <>
      <Head>
        <title>FilmDB | {media?.name ?? media?.title}</title>
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
                  {media?.release_date ?? "unknown release date"}
                </Text>
                <Text component="p">{media?.overview}</Text>
                <Button
                  className={classes.addBtn}
                  onClick={() => addToWatchedList(media)}
                >
                  Add to watched list
                </Button>
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

Media.getInitialProps = async (ctx) => {
  const slug = ctx.query.slug;
  const url = buildTMDBQuery(`${slug![0]}/${slug![1]}`);
  const res = await fetch(url);
  const data = await res.json();
  data.media_type = slug![0];
  if (data.success == false) {
    if (ctx.res) {
      ctx.res.writeHead(307, { Location: "/404" });
      ctx.res.end();
    }
    return { media: null };
  }

  return { media: data };
};

export default Media;
