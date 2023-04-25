import Head from "next/head";

import useSwr from "swr";
import format from "date-format";
import { useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import {
  Image,
  rem,
  createStyles,
  Text,
  Container,
  Title,
  LoadingOverlay,
  BackgroundImage,
  Stack,
  Group,
  Button,
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { TMDB_IMAGE_API_BASE_URL } from "@/lib/tmdb";
import { TMDBMedia } from "@/lib/types";
import { buildTMDBQuery } from "@/lib/tmdb";
import Link from "next/link";
import useIsDesktopDevice from "@/lib/hooks/useIsDesktopDevice";
import { Carousel } from "@mantine/carousel";

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

  showcaseImage: {
    height: "60vh",
    [`@media(min-width:${theme.breakpoints.md})`]: {
      height: "50vh",
      backgroundPositionY: "25%",
    },
  },

  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundImage:
      "linear-gradient(180deg, rgba(0,0,0,0.8) 24%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.9) 100%)",
    [`@media(min-width:${theme.breakpoints.md})`]: {
      backgroundImage:
        "radial-gradient(circle, rgba(0,0,0,0) 22%, rgba(0,0,0,1) 60%, rgba(0,0,0,1) 80%)",
    },
    height: "inherit",
  },

  showcaseContent: {
    color: theme.white,
    padding: theme.spacing.md,
  },

  visibleContent: {
    zIndex: 300,
    color: theme.colorScheme === "dark" ? theme.white : theme.black,
    position: "relative",
  },

  trendingList: {
    [`@media(max-width:${theme.breakpoints.md})`]: {
      marginBottom: "7rem",
    },
  },
}));

export default function Home() {
  const [visible] = useDisclosure(false);
  const { classes, cx } = useStyles();
  const [showcasedMedia, setShowcasedMedia] = useState<TMDBMedia | null>(null);
  const isDesktop = useIsDesktopDevice();

  const fetcher = (url: string) =>
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setShowcasedMedia(d.results[0]);
        return d.results.slice(1);
      });
  const { data, isLoading } = useSwr<TMDBMedia[]>(
    buildTMDBQuery("trending/all/week"),
    fetcher
  );

  const trendingMediaCarousel = (mediaType: "tv" | "movie") => {
    return (
      data && (
        <Carousel
          align="start"
          controlsOffset="xs"
          loop
          withControls={isDesktop}
          breakpoints={[
            {
              minWidth: "md",
              slideSize: "28%",
              slideGap: "md",
            },
            {
              maxWidth: "md",
              slideSize: "30.333%",
              slideGap: "xs",
            },
          ]}
        >
          {data
            .filter((m) => m.media_type == mediaType)
            .map((m) => (
              <Carousel.Slide key={m.id}>
                <Link href={`/media/${mediaType}/${m.id}`}>
                  <Image
                    radius="sm"
                    src={`${TMDB_IMAGE_API_BASE_URL}/w${
                      isDesktop ? "342" : "185"
                    }/${m.poster_path}`}
                    alt={`${
                      m.title ?? m.name ?? m.original_name ?? m.original_title
                    }`}
                  />
                </Link>
              </Carousel.Slide>
            ))}
        </Carousel>
      )
    );
  };

  return (
    <>
      <Head>
        <title>Home | FilmDB</title>
      </Head>
      {isLoading ? (
        <LoadingOverlay visible={visible} overlayBlur={2} />
      ) : (
        data &&
        showcasedMedia && (
          <>
            <BackgroundImage
              className={classes.showcaseImage}
              src={`${TMDB_IMAGE_API_BASE_URL}/${
                isDesktop ? "w1280" : "w342"
              }/${
                isDesktop
                  ? showcasedMedia!.backdrop_path
                  : showcasedMedia!.poster_path
              }`}
            >
              <div className={classes.overlay} />
              <Container
                h="100%"
                sx={{ zIndex: 300, position: "relative" }}
                className={cx(classes.visibleContent, classes.showcaseContent)}
              >
                <Stack spacing="sm">
                  <div>
                    <Text>Trending Now</Text>
                    <Title order={1}>
                      {showcasedMedia!.title ??
                        showcasedMedia!.name ??
                        showcasedMedia!.original_name ??
                        showcasedMedia!.original_title}
                    </Title>
                  </div>
                  <Group>
                    <Text>
                      {format("yyyy", new Date(showcasedMedia!.release_date))}
                    </Text>
                    <Button size="sm" color="dark" compact radius="xl">
                      Info
                    </Button>
                    <Button
                      leftIcon={<IconPlus size={rem(16)} />}
                      radius="xl"
                      size="sm"
                      compact
                    >
                      Add
                    </Button>
                  </Group>
                </Stack>
              </Container>
            </BackgroundImage>
            <Container
              className={cx(classes.visibleContent, classes.trendingList)}
            >
              <Stack my={rem(32)}>
                <Text fw="bold" tt="capitalize" fz="lg" component="h2">
                  trending movies
                </Text>
                {trendingMediaCarousel("movie")}

                <Text fw="bold" tt="capitalize" fz="lg" component="h2">
                  trending tv shows
                </Text>
                {trendingMediaCarousel("tv")}
              </Stack>
            </Container>
          </>
        )
      )}
    </>
  );
}
