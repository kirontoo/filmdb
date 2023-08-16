import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

import { getQueryValue } from "@/lib/util";
import { useRouter } from "next/router";
import {
  Container,
  createStyles,
  Flex,
  Group,
  LoadingOverlay,
  Rating,
  Stack,
  Text,
  Image,
  Divider,
} from "@mantine/core";
import { CommentList, NothingFoundBackground } from "@/components";
import { buildTMDBImageURL, buildTMDBQuery } from "@/lib/tmdb";
import { TMDBMedia } from "@/lib/types";
import useAsyncFn from "@/lib/hooks/useAsyncFn";
import { useEffect, useState } from "react";
import { CommentProvider } from "@/context/CommentProvider";
import { Media } from "@prisma/client";
import { useDisclosure } from "@mantine/hooks";
import { useMediaContext } from "@/context/MediaProvider";

const useStyles = createStyles((theme) => ({
  imgContainer: {
    minWidth: "200px",
    [`@media (min-width:${theme.breakpoints.md})`]: {
      margin: 0,
    },
  },
}));

const fetchTmdbMedia = async ({
  mediaType,
  tmdbId,
}: {
  mediaType: "tv" | "movie";
  tmdbId: string;
}): Promise<TMDBMedia> => {
  try {
    const url = buildTMDBQuery(`${mediaType}/${tmdbId}`);
    const res = await fetch(url);

    const data = await res.json();
    if (res.ok) {
      return data;
    }
    throw new Error("could not find TMDB media");
  } catch (err) {
    return await Promise.reject(err ?? "Error");
  }
};

const fetchMedia = async ({
  communityId,
  mediaId,
}: {
  communityId: string;
  mediaId: string;
}): Promise<Media> => {
  try {
    const url = `/api/community/${communityId}/media/${mediaId}`;
    const res = await fetch(url);
    const json = await res.json();
    if (res.ok) {
      return json.data.media;
    }

    throw new Error("could not find media");
  } catch (err) {
    return await Promise.reject(err ?? "Error");
  }
};

// NOTE: route path: /community/[slug]/media/[mediaType]/[tmdbId]/[id]
function CommunityMediaPage() {
  const router = useRouter();
  const mId = getQueryValue(router.query.mediaId);
  const tmdbId = getQueryValue(router.query.tmdbId);
  const mediaType = getQueryValue(router.query.mediaType);
  const communitySlug = getQueryValue(router.query.slug);
  const { classes } = useStyles();
  const [rateMedia, setRateMedia] = useState(1);
  const [opened, { close: closeRateInput, toggle }] = useDisclosure(false);

  const { updateMedias, removeMedia } = useMediaContext();

  const getTmdbMediaFn = useAsyncFn(fetchTmdbMedia);
  const getMediaFn = useAsyncFn(fetchMedia);

  const loadData = async () => {
    try {
      await getTmdbMediaFn.execute({
        mediaType,
        tmdbId,
      });
      await getMediaFn.execute({
        communityId: communitySlug,
        mediaId: mId,
      });
    } catch (e) {}
  };

  useEffect(() => {
    loadData();
  }, [router.query]);

  const updateRating = async (value: number) => {
    if (value < 0) {
      closeRateInput();
      return;
    }

    // dispatch({ type: "isLoadingRateMedia" });
    setRateMedia(value);

    // api call
    try {
      const res = await fetch(
        `/api/community/${communitySlug}/media/${mId}/rating`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            value: value,
          }),
        }
      );

      if (res.ok && getMediaFn.value) {
        const data = await res.json();
        // update the state
        getMediaFn.value.rating = data.data.media.rating;
        updateMedias(mId!, { ...getMediaFn.value });
      }
    } catch (error) {
    } finally {
      setRateMedia(0);
      closeRateInput();
      // dispatch({ type: "stopLoadingRateMedia" });
    }
  };

  if (getTmdbMediaFn.loading || getMediaFn.loading) {
    return <LoadingOverlay visible={true} />;
  }

  if (getTmdbMediaFn.error !== undefined || getMediaFn.error !== undefined) {
    return (
      <Container>
        <NothingFoundBackground
          title="Media does not exist"
          btnText="Go back to community"
          btnLink={`/community/${communitySlug}`}
        />
      </Container>
    );
  }

  if (getTmdbMediaFn.value && getMediaFn.value) {
    return (
      <Container>
        <Stack>
          <Flex gap="md" direction={{ base: "column", lg: "row" }}>
            <div className={classes.imgContainer}>
              <Image
                src={buildTMDBImageURL(getTmdbMediaFn.value.poster_path, 342)}
                alt={`${getTmdbMediaFn.value.title} poster`}
                radius="md"
              />
            </div>
            <Stack w="80%">
              <Flex
                gap="md"
                justify={{ base: "space-between", lg: "flex-start" }}
                align="center"
              >
                <Text>
                  {getTmdbMediaFn.value.title ?? getTmdbMediaFn.value.name}
                </Text>
                <Group
                  sx={(theme) => ({
                    padding: "0.2rem",
                  })}
                >
                  <Rating
                    readOnly
                    value={getMediaFn.value.rating}
                    defaultValue={1}
                    color="yellow.4"
                  />
                  <Text fz="sm">{getMediaFn.value.rating}/5</Text>
                </Group>
              </Flex>
              <Text component="h3">
                {getTmdbMediaFn.value.release_date ??
                  getTmdbMediaFn.value.first_air_date ??
                  "Release Date: N/A"}
              </Text>
              <Text component="p">{getTmdbMediaFn.value.overview}</Text>
            </Stack>
          </Flex>

          <Divider
            label="comments"
            labelPosition="center"
            labelProps={{ fz: "md" }}
          />
          <CommentProvider communityId={communitySlug!} mediaId={mId!}>
            <CommentList />
          </CommentProvider>
        </Stack>
      </Container>
    );
  }
}

export default CommunityMediaPage;
