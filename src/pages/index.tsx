import Head from "next/head";
import { Footer, Navbar, MovieImageCard } from "@/components";
import { useState, useEffect } from "react";
import { useDisclosure } from "@mantine/hooks";
import { Container, Grid, LoadingOverlay } from "@mantine/core";
import { TMDB_IMAGE_API_BASE_URL } from "@/lib/tmdb";
import { Media } from "@/lib/types";
import { buildTMDBQuery } from "@/lib/tmdb";

export default function Home() {
  const [visible, handlers] = useDisclosure(false);
  const [data, setData] = useState<Media[]>([]);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
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
                  <MovieImageCard
                    image={`${TMDB_IMAGE_API_BASE_URL}/w500/${m.poster_path}`}
                    title={m.title}
                    releaseDate={m.release_date}
                    rating={m.vote_average}
                  />
                </Grid.Col>
              );
            })}
          </Grid>
        </Container>
      )}
    </>
  );
}
