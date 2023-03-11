import { useRouter } from "next/router";
import { Button, createStyles, Container, LoadingOverlay } from "@mantine/core";
import { buildTMDBQuery } from "@/lib/tmdb";
import { Media as MediaType } from "@/lib/types";
import { useMediaContext } from "@/context/MediaProvider";
import Head from "next/head";
import { NextPage } from 'next'

const useStyles = createStyles((theme) => ({
  addBtn: {
    textTransform: "uppercase",
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
          <div>
            id: {slug[1]}, name: {media?.name ?? media?.title}
          </div>
          <Button
            className={classes.addBtn}
            onClick={() => addToWatchedList(media)}
          >
            Add to watched list
          </Button>
        </>
      </Container>
    </>
  );
}

Media.getInitialProps = async (ctx) => {
  const slug = ctx.query.slug;
  const url = buildTMDBQuery(`${slug![0]}/${slug![1]}`);
  const res = await fetch(url);
  const data = await res.json();
  data.media_type = slug![0];

  return { media: data };
};

export default Media;
