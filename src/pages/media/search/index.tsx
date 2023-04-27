import {
  Stack,
  rem,
  Text,
  Container,
  createStyles,
  Grid,
  Title,
  TextInput,
  Loader,
} from "@mantine/core";

import { IconSearch, IconStarFilled } from "@tabler/icons-react";
import {
  MediaImageCard,
  MediaImageCardHeader,
  MediaImageCardFooter,
  NothingFoundBackground,
} from "@/components";
import { buildTMDBQuery, TMDB_IMAGE_API_BASE_URL } from "@/lib/tmdb";
import { TMDBMedia } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useDebouncedValue, useInputState } from "@mantine/hooks";

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

function SearchMedia() {
  const router = useRouter();
  const { query } = router;
  const { classes } = useStyles();
  const [medias, setMedias] = useState<TMDBMedia[] | null>([]);
  const [searchInput, setSearchInput] = useInputState("");
  const [debouncedSearchInput, cancel] = useDebouncedValue(searchInput, 300, {
    leading: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  // update search input to match url query
  useEffect(() => {
    const { media } = query;
    const input = Array.isArray(media) ? media[0] : media;
    if (input && input !== searchInput) {
      // cancel debounce when updating search input value
      // should only apply when the user first drops into the page
      setSearchInput(input);
      cancel();
    }
  }, []);

  useEffect(() => {
    const { media } = query;
    const input = Array.isArray(media) ? media[0] : media;
    if (input) {
      searchMedias(input);
    }
  }, [query]);

  // update history with media queries
  useEffect(() => {
    if (debouncedSearchInput !== "") {
      router.push({
        pathname: "/media/search",
        query: {
          media: debouncedSearchInput,
        },
      });
    }
  }, [debouncedSearchInput]);

  const searchMedias = async (input: string) => {
    setIsLoading(true);
    const apiQuery = encodeURI(`query=${input}&page=1`);
    const url = buildTMDBQuery("search/multi", apiQuery);
    const res = await fetch(url);

    if (res.ok) {
      const data = await res.json();
      if (data.results.length == 0) {
        setMedias(null);
      }
      const medias = data.results.filter(
        (m: TMDBMedia) => m.media_type !== "person"
      );
      setMedias(medias);
    }
    setIsLoading(false);
  };

  return (
    <>
      <Container size="xl" py="1rem" mb="6rem">
        <Stack>
          <TextInput
            value={searchInput}
            onChange={setSearchInput}
            icon={<IconSearch size="1.1rem" stroke={1.5} />}
            placeholder="Search for movies and shows"
            rightSection={isLoading && <Loader size="xs" />}
            autoFocus
          />
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
        </Stack>
      </Container>
    </>
  );
}

export default SearchMedia;
