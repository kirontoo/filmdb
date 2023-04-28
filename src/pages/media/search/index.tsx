import {
  SimpleGrid,
  Stack,
  rem,
  Text,
  Container,
  createStyles,
  Title,
  TextInput,
  Loader,
  useMantineTheme,
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
import useIsDesktopDevice from "@/lib/hooks/useIsDesktopDevice";

const useStyles = createStyles((theme) => ({
  mediaTitle: {
    width: "50%",
  },
  title: {
    fontFamily: `Greycliff CF ${theme.fontFamily}`,
    fontWeight: 900,
    color: theme.white,
    lineHeight: 1.2,
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
  const [debouncedSearchInput, cancel] = useDebouncedValue(searchInput, 300);
  const [isLoading, setIsLoading] = useState(false);
  const isDesktop = useIsDesktopDevice();
  const theme = useMantineTheme();

  useEffect(() => {
    const { media } = query;
    const input = Array.isArray(media) ? media[0] : media;
    if (input) {
      searchMedias(input);

      // update search input to match url query
      if (input !== searchInput) {
        // cancel debounce when updating search input value
        // should only apply when the user first drops into the page
        setSearchInput(input);
        cancel();
      }
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
    const apiQuery = encodeURI(`query=${input}&page=1&inclued_adult=false`);
    const url = buildTMDBQuery("search/multi", apiQuery);
    const res = await fetch(url);

    if (res.ok) {
      const data = await res.json();
      const results = data.results.filter(
        (m: TMDBMedia) => m.media_type !== "person"
      );
      if (results.length == 0) {
        setMedias(null);
      } else {
        setMedias(results);
      }
    }
    setIsLoading(false);
  };

  const MediaCards = () => {
    return (
      medias && (
        <SimpleGrid
          cols={2}
          breakpoints={[
            { minWidth: theme.breakpoints.md, cols: 5 },
            { minWidth: theme.breakpoints.sm, cols: 4 },
          ]}
        >
          {medias.map((m) => {
            return (
              <MediaImageCard
                component={Link}
                href={`/media/${m.media_type}/${m.id}`}
                image={`${TMDB_IMAGE_API_BASE_URL}/w${
                  isDesktop ? "342" : "185"
                }/${m.poster_path}`}
              >
                <MediaImageCardHeader>
                  <>
                    <Text className={classes.date} size="xs">
                      {m.release_date ?? m.first_air_date}
                    </Text>
                    <Title order={3} fz="xl" className={classes.title}>
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
            );
          })}
        </SimpleGrid>
      )
    );
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
            <MediaCards />
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
