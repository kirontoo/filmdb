import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

import { getQueryValue } from "@/lib/util";
import { useRouter } from "next/router";
import { modals } from "@mantine/modals";
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
  Tooltip,
  ActionIcon,
  Transition,
  Box,
} from "@mantine/core";
import { CommentList, NothingFoundBackground } from "@/components";
import { buildTMDBImageURL, buildTMDBQuery } from "@/lib/tmdb";
import { TMDBMedia } from "@/lib/types";
import useAsyncFn from "@/lib/hooks/useAsyncFn";
import { useEffect, useReducer, useState } from "react";
import { CommentProvider } from "@/context/CommentProvider";
import { Media } from "@prisma/client";
import { useDisclosure } from "@mantine/hooks";
import { useMediaContext } from "@/context/MediaProvider";
import {
  IconList,
  IconBookmark,
  IconTrash,
  IconStarsFilled,
} from "@tabler/icons-react";
import Notify from "@/lib/notify";
import useCommunityPermissions from "@/lib/hooks/useCommunityPermissions";
import { updateMedia } from "@/services/medias";

interface LoadingState {
  loadingAddToWatchedList: boolean;
  loadingAddToQueue: boolean;
  loadingDeleteMedia: boolean;
  loadingRateMedia: boolean;
}

type LoadingAction =
  | { type: "isLoadingQueue" }
  | { type: "stopLoadingQueue" }
  | { type: "isLoadingWatchedList" }
  | { type: "stopLoadingWatchedList" }
  | { type: "isLoadingDeleteMedia" }
  | { type: "stopLoadingDeleteMedia" }
  | { type: "isLoadingRateMedia" }
  | { type: "stopLoadingRateMedia" };

function reducer(state: LoadingState, action: LoadingAction): LoadingState {
  const { type } = action;
  switch (type) {
    case "isLoadingQueue":
      return { ...state, loadingAddToQueue: true };
    case "isLoadingWatchedList":
      return { ...state, loadingAddToWatchedList: true };
    case "isLoadingRateMedia":
      return { ...state, loadingRateMedia: true };
    case "isLoadingDeleteMedia":
      return { ...state, loadingDeleteMedia: true };
    case "stopLoadingQueue":
      return { ...state, loadingAddToQueue: false };
    case "stopLoadingWatchedList":
      return { ...state, loadingAddToWatchedList: false };
    case "stopLoadingDeleteMedia":
      return { ...state, loadingDeleteMedia: false };
    case "stopLoadingRateMedia":
      return { ...state, loadingRateMedia: false };
    default:
      throw Error("Unknown action");
  }
}

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

  // communities that the user has permission to modify
  const permittedCommunities = useCommunityPermissions();
  const isPermitted = permittedCommunities.some(
    (c) => c.slug === communitySlug
  );

  const [
    {
      loadingAddToQueue,
      loadingAddToWatchedList,
      loadingDeleteMedia,
      loadingRateMedia,
    },
    dispatch,
  ] = useReducer(reducer, {
    loadingAddToQueue: false,
    loadingAddToWatchedList: false,
    loadingDeleteMedia: false,
    loadingRateMedia: false,
  });

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

  const openDeleteModal = () => {
    modals.openConfirmModal({
      title: `Delete ${getMediaFn.value!.title} from lists`,
      centered: true,
      children: (
        <Text component="p">
          Are you sure you want to delete{" "}
          <strong>{getMediaFn.value!.title}</strong>? This action is destructive
          and will delete it from <strong>all lists</strong>.
        </Text>
      ),
      labels: {
        confirm: "Delete",
        cancel: "Cancel",
      },
      closeOnConfirm: false,
      size: "md",
      cancelProps: { variant: "subtle", color: "dark" },
      confirmProps: {
        color: "red",
        loading: loadingDeleteMedia,
        leftIcon: <IconTrash />,
      },
      onConfirm: deleteFromList,
    });
  };

  const deleteFromList = async () => {
    try {
      dispatch({ type: "isLoadingDeleteMedia" });
      const res = await fetch(`/api/community/${communitySlug}/media/${mId}`, {
        method: "DELETE",
      });

      // const data = res.json();
      if (res.ok) {
        removeMedia(mId!);
        Notify.success(`Deleted ${getMediaFn.value!.title}`);
        modals.closeAll();
      } else {
        throw new Error(`Could not delete ${getMediaFn.value!.title}`);
      }
    } catch (error) {
      Notify.error(error as string);
    } finally {
      dispatch({ type: "stopLoadingDeleteMedia" });
      router.push(`/community/${communitySlug}`);
    }
  };

  const addToList = async (watched: boolean) => {
    const watchedText = watched ? "watched list" : "queue";
    try {
      dispatch({ type: watched ? "isLoadingWatchedList" : "isLoadingQueue" });

      // API fetch
      const media = { ...getMediaFn.value, watched };
      const { res, data } = await updateMedia(media as Media);

      if (res.ok) {
        // update media state
        updateMedias(getMediaFn.value!.id, data.data.media);

        Notify.success(`Moved ${getMediaFn.value!.title} to ${watchedText}`);
      } else {
        throw new Error(
          `Could not move ${getMediaFn.value!.title} to ${watchedText}`
        );
      }
    } catch (error) {
      Notify.error(error as string);
    } finally {
      dispatch({
        type: watched ? "stopLoadingWatchedList" : "stopLoadingQueue",
      });
    }
  };

  const updateRating = async (value: number) => {
    if (value < 0) {
      closeRateInput();
      return;
    }

    dispatch({ type: "isLoadingRateMedia" });
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
      Notify.error("Rating", "could not add rating");
    } finally {
      setRateMedia(0);
      closeRateInput();
      dispatch({ type: "stopLoadingRateMedia" });
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
                  sx={() => ({
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

              <Group>
                {isPermitted && (
                  <>
                    <Tooltip label="Delete from all lists">
                      <ActionIcon
                        variant="subtle"
                        loading={loadingDeleteMedia}
                        onClick={openDeleteModal}
                        color="red"
                      >
                        <IconTrash />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Move to queue">
                      <ActionIcon
                        variant="subtle"
                        loading={loadingAddToQueue}
                        onClick={() => addToList(false)}
                        color="light"
                      >
                        <IconList />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Move to watched list">
                      <ActionIcon
                        variant="subtle"
                        loading={loadingAddToWatchedList}
                        onClick={() => addToList(true)}
                        color="blue"
                      >
                        <IconBookmark />
                      </ActionIcon>
                    </Tooltip>
                  </>
                )}
                <Tooltip label={`Rate ${getMediaFn.value.title}`}>
                  <ActionIcon
                    variant="subtle"
                    color="yellow"
                    onClick={toggle}
                    loading={loadingRateMedia}
                  >
                    <IconStarsFilled />
                  </ActionIcon>
                </Tooltip>
                <Transition
                  mounted={opened}
                  transition="slide-right"
                  duration={200}
                  timingFunction="ease-in-out"
                >
                  {(styles) => (
                    <Box
                      style={styles}
                      sx={(theme) => ({
                        background: theme.colors.gray[9],
                        borderRadius: theme.radius.sm,
                        padding: "0.2rem",
                        border: `1px solid ${theme.colors.gray[7]}`,
                      })}
                    >
                      <Rating
                        fractions={2}
                        value={rateMedia}
                        onChange={updateRating}
                        defaultValue={1}
                        color="yellow.4"
                      />
                    </Box>
                  )}
                </Transition>
              </Group>
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
