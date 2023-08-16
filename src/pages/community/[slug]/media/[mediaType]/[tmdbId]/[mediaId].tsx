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
} from "@mantine/core";
import { NothingFoundBackground } from "@/components";
import { buildTMDBImageURL, buildTMDBQuery } from "@/lib/tmdb";
import { TMDBMedia } from "@/lib/types";
import useAsyncFn from "@/lib/hooks/useAsyncFn";
import { useEffect } from "react";

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

  const getMedia = useAsyncFn(fetchTmdbMedia);

  const loadData = async () => {
    try {
      await getMedia.execute({
        mediaType,
        tmdbId,
      });
    } catch (e) {}
  };

  useEffect(() => {
    loadData();
  }, [router.query]);

  if (getMedia.loading) {
    return <LoadingOverlay visible={true} />;
  }

  if (getMedia.error !== undefined) {
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

  if (getMedia.value) {
    return (
      <Container>
        <Stack>
          <Flex gap="md" direction={{ base: "column", lg: "row" }}>
            <div className={classes.imgContainer}>
              <Image
                src={buildTMDBImageURL(getMedia.value.poster_path, 342)}
                alt={`${getMedia.value.title} poster`}
                radius="md"
              />
            </div>
          </Flex>
          <Stack>
            <Flex>
              <Text></Text>
              <Group>
                <Rating></Rating>
              </Group>
            </Flex>
            <Text></Text>
          </Stack>
        </Stack>
      </Container>
    );
  }
}

export default CommunityMediaPage;
