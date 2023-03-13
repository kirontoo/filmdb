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
          <Flex
            gap="md"
            justify="flex-start"
            align="flex-start"
            direction={{ base: "column", lg: "row" }}
          >
            <Container>
              <Image
                src={buildTMDBImageURL(media?.poster_path, 500)}
                alt={`${media?.title ?? media?.name} poster`}
                radius="md"
              />
            </Container>

            <Stack spacing="sm">
              <Text component="h1">{media?.title ?? media?.name}</Text>
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

  return { media: data };
};

export default Media;
