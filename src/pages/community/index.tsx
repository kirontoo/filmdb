import { useRouter } from "next/router";
import Head from "next/head";
import { MovieImageCard } from "@/components";
import { Container, Grid } from "@mantine/core";
import { useMediaContext } from "@/context/MediaProvider";
import { TMDB_IMAGE_API_BASE_URL } from "@/lib/tmdb";

function Community() {
  const { medias } = useMediaContext();

  return (
    <>
      <Head>
        <title>FilmDB | search media</title>
      </Head>
      <Container size="xl">
        <Grid grow={false} columns={4}>
          {medias.map((m) => {
            return (
              <Grid.Col sm={2} lg={1} key={m.id}>
                <MovieImageCard
                  image={`${TMDB_IMAGE_API_BASE_URL}/w500/${m.poster_path ?? m.backdrop_path
                    }`}
                  title={m.title ?? m.name}
                  releaseDate={m.release_date}
                  rating={m.vote_average}
                  id={m.id}
                  mediaType={m.media_type}
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
