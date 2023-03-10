import { useRouter } from "next/router";
import Head from "next/head";
import { Layout, MovieImageCard } from "@/components";
import { Container, Grid } from "@mantine/core";
import { useMovieContext } from "@/context/MovieProvider";
import { TMDB_IMAGE_API_BASE_URL } from "@/lib";

function Community() {
  const { movies } = useMovieContext();
  const links = [
    {
      link: "/community/watched",
      label: "Watched",
    },
    {
      link: "/community/watchlist",
      label: "Watchlist",
    },
  ];

  return (
    <>
      <Head>
        <title>FilmDB | search media</title>
      </Head>
      <Container size="xl">
        <Grid grow={false} columns={4}>
          {movies.map((m) => {
            return (
              <Grid.Col sm={2} lg={1} key={m.id}>
                <MovieImageCard
                  image={`${TMDB_IMAGE_API_BASE_URL}/w500/${
                    m.poster_path ?? m.backdrop_path
                  }`}
                  title={m.title ?? m.name}
                  releaseDate={m.release_date}
                  rating={m.vote_average}
                />
              </Grid.Col>
            );
          })}
        </Grid>
      </Container>
    </>
  );
}

export default Community;
