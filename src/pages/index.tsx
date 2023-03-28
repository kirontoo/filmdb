import Head from "next/head";
import {
  MediaImageCard,
  MediaImageCardHeader,
  MediaImageCardFooter,
} from "@/components";
import { useState, useEffect } from "react";
import { useDisclosure } from "@mantine/hooks";
import {
  rem,
  createStyles,
  Text,
  Container,
  Grid,
  Title,
  LoadingOverlay,
} from "@mantine/core";
import { IconStarFilled } from "@tabler/icons-react";
import { TMDB_IMAGE_API_BASE_URL } from "@/lib/tmdb";
import { Media } from "@/lib/types";
import { buildTMDBQuery } from "@/lib/tmdb";
import Link from "next/link";

const useStyles = createStyles((theme) => ({
  title: {
    fontFamily: `Greycliff CF ${theme.fontFamily}`,
    fontWeight: 900,
    color: theme.white,
    lineHeight: 1.2,
    fontSize: rem(32),
    marginTop: theme.spacing.xs,
  },

  date: {
    color: theme.white,
    opacity: 0.7,
    fontWeight: 700,
    textTransform: "uppercase",
  },

  rating: {
    color: theme.white,
    opacity: 0.9,
    fontWeight: 700,
    textTransform: "uppercase",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: rem(5),
  },
}));

export default function Home() {
  const [visible, handlers] = useDisclosure(false);
  const { classes } = useStyles();
  const [data, setData] = useState<Media[]>([]);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    if (!data.length) {
      setLoading(true);
      handlers.open();
      const url = buildTMDBQuery("movie/popular");
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          setData(data.results);
          setLoading(false);
          handlers.close();
        });
    }
  }, []);

  return (
    <>
      <Head>
        <title>FilmDB | Home</title>
      </Head>
      {isLoading ? (
        <LoadingOverlay visible={visible} overlayBlur={2} />
      ) : (
        <Container size="xl">
          <Grid grow={false} columns={4}>
            {data.map((m) => {
              return (
                <Grid.Col sm={2} lg={1} key={m.id}>
                  <MediaImageCard
                    component={Link}
                    href={`/media/movie/${m.id}`}
                    image={`${TMDB_IMAGE_API_BASE_URL}/w500/${m.poster_path}`}
                  >
                    <MediaImageCardHeader>
                      <>
                        <Text className={classes.date} size="xs">
                          {m.release_date ?? m.first_air_date}
                        </Text>
                        <Title order={3} className={classes.title}>
                          {m.title ?? m.name ?? m.original_title}
                        </Title>
                      </>
                    </MediaImageCardHeader>
                    <MediaImageCardFooter className={classes.rating}>
                      <IconStarFilled
                        style={{ position: "relative", color: "yellow" }}
                      />
                      <Text>{m.vote_average}</Text>
                    </MediaImageCardFooter>
                  </MediaImageCard>
                </Grid.Col>
              );
            })}
          </Grid>
        </Container>
      )}
    </>
  );
}
