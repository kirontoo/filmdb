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
  Skeleton,
  Divider,
  Transition,
} from "@mantine/core";
import InfiniteScroll from "react-infinite-scroller";
import { IconSearch, IconStarFilled } from "@tabler/icons-react";
import {
  MediaImageCard,
  MediaImageCardHeader,
  MediaImageCardFooter,
  NothingFoundBackground,
} from "@/components";
import { buildTMDBQuery, getTitle, TMDB_IMAGE_API_BASE_URL } from "@/lib/tmdb";
import { TMDBMedia } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
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
  const [mounted, setMounted] = useState(false);

  const [nextPage, setNextPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalResults, setTotalResults] = useState<number>(0);

  useEffect(() => setMounted(true), []);

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
    if (isLoading) {
      return;
    }
    try {
      setIsLoading(true);
      const apiQuery = encodeURI(`query=${input}&page=1&include_adult=false`);
      const url = buildTMDBQuery("search/multi", apiQuery);
      const res = await fetch(url);

      if (res.ok) {
        const data = await res.json();
        const results = data.results.filter(
          (m: TMDBMedia) => m.media_type !== "person"
        );
        if (results.length == 0) {
          setMedias(null);
          setTotalResults(0);
        } else {
          setTotalPages(data.total_pages);
          setTotalResults(data.total_results);
          setMedias(results);
        }
      }
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreMedia = useCallback(async () => {
    if (isLoading) {
      return;
    }
    try {
      setIsLoading(true);
      const apiQuery = encodeURI(
        `query=${searchInput}&page=${nextPage + 1}&include_adult=false`
      );
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
          if (nextPage < totalPages) {
            setNextPage((prev: number) => prev + 1);
          }
          setMedias((prev: TMDBMedia[] | null) => {
            if (prev) {
              return [...prev, ...results];
            } else {
              return results;
            }
          });
        }
      }
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  }, [medias, isLoading, nextPage]);

  const SkeletonLoader = () => {
    return (
      <SimpleGrid
        key="loader"
        cols={2}
        breakpoints={[
          { minWidth: theme.breakpoints.md, cols: 5 },
          { minWidth: theme.breakpoints.sm, cols: 4 },
        ]}
        mt="md"
      >
        <Skeleton>
          <MediaImageCard />
        </Skeleton>
        <Skeleton>
          <MediaImageCard />
        </Skeleton>
        <Skeleton>
          <MediaImageCard />
        </Skeleton>
        <Skeleton>
          <MediaImageCard />
        </Skeleton>
      </SimpleGrid>
    );
  };

  const MediaCards = () => {
    return (
      medias && (
        <InfiniteScroll
          pageStart={1}
          loadMore={loadMoreMedia}
          hasMore={nextPage <= totalPages}
          initialLoad={false}
          loader={<SkeletonLoader />}
        >
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
                  key={m.id}
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
                        {getTitle(m)}
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
        </InfiniteScroll>
      )
    );
  };

  return (
    <>
      <Container size="xl" py="1rem" mb="6rem">
        <Stack sx={{ position: "relative" }}>
          <Transition
            mounted={mounted}
            transition="slide-down"
            duration={100}
            timingFunction="ease-in"
          >
            {(styles) => (
              <TextInput
                style={styles}
                value={searchInput}
                onChange={setSearchInput}
                icon={<IconSearch size="1.1rem" stroke={1.5} />}
                placeholder="Search for movies and shows"
                rightSection={isLoading && <Loader size="xs" />}
                autoFocus
              />
            )}
          </Transition>
          {medias ? (
            <>
              <Divider
                label={`Found ${totalResults} results`}
                labelPosition="center"
              />
              <MediaCards />
            </>
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
