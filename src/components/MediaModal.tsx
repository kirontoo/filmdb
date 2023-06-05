import {
  createStyles,
  ActionIcon,
  Group,
  Text,
  Stack,
  Flex,
  Image,
  Tooltip,
} from "@mantine/core";
import { ContextModalProps, modals } from "@mantine/modals";
import { useReducer } from "react";
import Notify from "@/lib/notify";
import useSwr from "swr";
import { buildTMDBImageURL, buildTMDBQuery } from "@/lib/tmdb";
import { Media } from "@prisma/client";
import { IconList, IconBookmark, IconTrash } from "@tabler/icons-react";
import { TMDBMedia } from "@/lib/types";
import { updateMedia } from "@/lib/util";
import { useMediaContext } from "@/context/MediaProvider";

interface MediaModalProps {
  media: Media;
  communityId: string;
}

interface LoadingState {
  loadingAddToWatchedList: boolean;
  loadingAddToQueue: boolean;
  loadingDeleteMedia: boolean;
}

type LoadingAction =
  | { type: "isLoadingQueue" }
  | { type: "stopLoadingQueue" }
  | { type: "isLoadingWatchedList" }
  | { type: "stopLoadingWatchedList" }
  | { type: "isLoadingDeleteMedia" }
  | { type: "stopLoadingDeleteMedia" };

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
    case "isLoadingDeleteMedia":
      return { ...state, loadingDeleteMedia: true };
    case "stopLoadingQueue":
      return { ...state, loadingAddToQueue: false };
    case "stopLoadingWatchedList":
      return { ...state, loadingAddToWatchedList: false };
    case "stopLoadingDeleteMedia":
      return { ...state, loadingDeleteMedia: false };
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
    { loadingAddToQueue, loadingAddToWatchedList, loadingDeleteMedia },
    dispatch,
  ] = useReducer(reducer, {
    loadingAddToQueue: false,
    loadingAddToWatchedList: false,
    loadingDeleteMedia: false,
  });
  const { media, communityId } = innerProps;
  const { updateMedias, removeMedia } = useMediaContext();

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

  return (
    <>
      {!isLoading && (
        <>
          <Flex gap="md">
            <div className={classes.imgContainer}>
              <Image
                src={buildTMDBImageURL(media.posterPath, 342)}
                alt={`${media.title} poster`}
                radius="md"
              />
            </div>
            <Stack spacing="sm">
              <Text fz="xl" component="h1">
                {data?.title ?? data?.name}
              </Text>
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
                    loading={loadingAddToWatchedList}
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
                    variant="filled"
                    loading={loadingAddToWatchedList}
                    onClick={() => addToList(true)}
                    color="blue"
                  >
                    <IconBookmark />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Stack>
          </Flex>
        </>
      )}
    </>
  );
}
