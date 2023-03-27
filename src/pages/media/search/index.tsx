import { Container, Grid, Title } from "@mantine/core";
import { MovieImageCard } from "@/components";
import { buildTMDBQuery, TMDB_IMAGE_API_BASE_URL } from "@/lib/tmdb";
import { Media } from "@/lib/types";
import { GetServerSideProps } from "next";

interface SearchMediaProps {
  medias: Media[] | null;
  message?: string;
}

function SearchMedia({ medias, message }: SearchMediaProps) {
  return (
    <>
      <Container size="xl">
        {medias ? (
          <Grid grow={false} columns={4}>
            {medias.map((m) => {
              return (
                <Grid.Col sm={2} lg={1} key={m.id}>
                  <MovieImageCard
                    image={`${TMDB_IMAGE_API_BASE_URL}/w500/${m.poster_path}`}
                    title={m.title}
                    releaseDate={m.release_date}
                    rating={m.vote_average}
                    mediaType={m.media_type}
                    id={m.id}
                  />
                </Grid.Col>
              );
            })}
          </Grid>
        ) : (
          <Title align="center" transform="capitalize">{message}</Title>
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
      return {
        props: { medias: null, message: "no media found" },
      };
    }
    const medias = data.results.filter((m: Media) => m.media_type !== "person");
    return { props: { medias } };
  }

  return {
    props: { medias: null, message: "no media found" },
  };
};
