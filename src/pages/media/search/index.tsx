import { rem, Text, Container, createStyles, Grid, Title } from "@mantine/core";

import { IconStarFilled } from "@tabler/icons-react";
import {
  MediaImageCard,
  MediaImageCardHeader,
  MediaImageCardFooter,
  NothingFoundBackground,
} from "@/components";
import { buildTMDBQuery, TMDB_IMAGE_API_BASE_URL } from "@/lib/tmdb";
import { Media } from "@/lib/types";
import { GetServerSideProps } from "next";
import Link from "next/link";

interface SearchMediaProps {
  medias: Media[] | null;
}

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

function SearchMedia({ medias }: SearchMediaProps) {
  const { classes } = useStyles();
  return (
    <>
      <Container size="xl">
        {medias ? (
          <Grid grow={false} columns={4}>
            {medias.map((m) => {
              return (
                <Grid.Col sm={2} lg={1} key={m.id}>
                  <MediaImageCard
                    component={Link}
                    href={`/media/${m.media_type}/${m.id}`}
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
        ) : (
          <NothingFoundBackground
            title="No Media Found"
            description="Whoops! We couldn't find anything. Maybe try a different keyword?"
            backgroundImage={false}
          />
        )}
      </Container>
    </>
  );
}

export default SearchMedia;

export const getServerSideProps: GetServerSideProps<SearchMediaProps> = async (
  context
) => {
  context.res.setHeader(
    "Cache-Control",
    "public, s-maxage=10, stale-while-revalidate=59"
  );

  const { query } = context;
  const { media } = query;

  const apiQuery = encodeURI(`query=${media}&page=1`);
  const url = buildTMDBQuery("search/multi", apiQuery);
  const res = await fetch(url);

  if (res.ok) {
    const data = await res.json();
    if (data.results.length == 0) {
      return { props: { medias: null },
      };
    }
    const medias = data.results.filter((m: Media) => m.media_type !== "person");
    return { props: { medias } };
  }

  return {
    props: { medias: null },
  };
};
