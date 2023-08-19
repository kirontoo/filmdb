import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

import {
  createStyles,
  ActionIcon,
  Group,
  Text,
  Stack,
  Flex,
  Image,
  Tooltip,
  Rating,
  Box,
  Transition,
  Divider,
} from "@mantine/core";
import { ContextModalProps, modals } from "@mantine/modals";
import { useReducer, useState } from "react";
import Notify from "@/lib/notify";
import useSwr from "swr";
import { buildTMDBImageURL, buildTMDBQuery } from "@/lib/tmdb";
import {
  IconList,
  IconBookmark,
  IconTrash,
  IconStarsFilled,
} from "@tabler/icons-react";
import { TMDBMedia } from "@/lib/types";
import { updateMedia } from "@/services/medias";
import { useMediaContext } from "@/context/MediaProvider";
import { useDisclosure } from "@mantine/hooks";
import { CommentList } from ".";
import { CommentProvider } from "@/context/CommentProvider";
import { Media } from "@prisma/client";

interface MediaModalProps {
  media: Media;
  communityId: string;
}

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

const useStyles = createStyles((theme) => ({
  imgContainer: {
    minWidth: "200px",
    [`@media (min-width:${theme.breakpoints.md})`]: {
      margin: 0,
    },
  },
}));

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
      return { ...state, loadingRateMedia: true };
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

export default function MediaModal({
  context,
  id,
  innerProps,
}: ContextModalProps<MediaModalProps>) {
  const { classes } = useStyles();

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
  const { media, communityId } = innerProps;
  const { updateMedias, removeMedia } = useMediaContext();
  const [opened, { close: closeRateInput, toggle }] = useDisclosure(false);
  const [rateMedia, setRateMedia] = useState(1);

  const fetcher = (url: string) => fetch(url).then((r) => r.json());
  const { data, isLoading } = useSwr<TMDBMedia>(
    buildTMDBQuery(`${innerProps.media.mediaType}/${innerProps.media.tmdbId}`),
    fetcher
  );

  const openDeleteModal = () => {
    modals.openConfirmModal({
      title: `Delete ${media.title} from lists`,
      centered: true,
      children: (
        <Text component="p">
          Are you sure you want to delete <strong>{media.title}</strong>? This
          action is destructive and will delete it from{" "}
          <strong>all lists</strong>.
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
    dispatch({ type: "isLoadingDeleteMedia" });
    try {
      const res = await fetch(
        `/api/community/${communityId}/media/${media.id}`,
        { method: "DELETE" }
      );

      // const data = res.json();
      if (res.ok) {
        removeMedia(media.id);
        Notify.success(`Deleted ${media.title}`);
        modals.closeAll();
      } else {
        throw new Error(`Could not delete ${media.title}`);
      }
    } catch (error) {
      Notify.error(error as string);
    } finally {
      dispatch({ type: "stopLoadingDeleteMedia" });
    }
  };

  const addToList = async (watched: boolean) => {
    const watchedText = watched ? "watched list" : "queue";
    try {
      dispatch({ type: watched ? "isLoadingWatchedList" : "isLoadingQueue" });

      // API fetch
      media.watched = watched;
      const { res, data } = await updateMedia(media);

      if (res.ok) {
        // update media state
        updateMedias(media.id, data.data.media);

        Notify.success(`Moved ${media.title} to ${watchedText}`);
      } else {
        throw new Error(
          `Could not move ${innerProps.media.title} to ${watchedText}`
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
        `/api/community/${media.communityId}/media/${media.id}/rating`,
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

      if (res.ok) {
        const data = await res.json();
        // update the state
        media.rating = data.data.media.rating;
        updateMedias(media.id, { ...media });
      }
    } catch (error) {
    } finally {
      setRateMedia(0);
      closeRateInput();
      dispatch({ type: "stopLoadingRateMedia" });
    }
  };

  return (
    <>
      {!isLoading && (
        <>
          <Stack>
            <Flex gap="md" direction={{ base: "column", lg: "row" }}>
              <div className={classes.imgContainer}>
                <Image
                  src={buildTMDBImageURL(media.posterPath, 342)}
                  alt={`${media.title} poster`}
                  radius="md"
                />
              </div>
              <Stack spacing="sm">
                <Flex gap="md" justify={{base: "space-between", lg: "flex-start"}}>
                  <Text fz="xl" component="h1">
                    {data?.title ?? data?.name}
                  </Text>

                  <Group
                    sx={(theme) => ({
                      background: theme.colors.gray[9],
                      borderRadius: theme.radius.sm,
                      padding: "0.2rem",
                      border: `1px solid ${theme.colors.gray[7]}`,
                    })}
                  >
                    <Rating
                      value={media.rating}
                      fractions={5}
                      readOnly
                      color="yellow.4"
                    />
                    <Text>{media.rating}/5</Text>
                  </Group>
                </Flex>
                <Text component="h3">
                  {data?.release_date ??
                    data?.first_air_date ??
                    "Release Date: N/A"}
                </Text>
                <Text component="p">{data?.overview}</Text>
                <Group>
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
                  <Tooltip label={`Rate ${media.title}`}>
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
            <CommentProvider communityId={communityId} mediaId={media.id}>
              <CommentList />
            </CommentProvider>
          </Stack>
        </>
      )}
    </>
  );
}
