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
import { ContextModalProps } from "@mantine/modals";
import { useReducer } from "react";
import Notify from "@/lib/notify";
import useSwr from "swr";
import { buildTMDBImageURL, buildTMDBQuery } from "@/lib/tmdb";
import { Media } from "@prisma/client";
import { IconList, IconBookmark } from "@tabler/icons-react";
import { TMDBMedia } from "@/lib/types";
import { addMediaToList } from "@/lib/util";

interface MediaModalProps {
  media: Media;
  communityId: string;
}

interface LoadingState {
  loadingAddToWatchedList: boolean;
  loadingAddToQueue: boolean;
}

type LoadingAction =
  | { type: "isLoadingQueue" }
  | { type: "stopLoadingQueue" }
  | { type: "isLoadingWatchedList" }
  | { type: "stopLoadingWatchedList" };

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
    case "stopLoadingQueue":
      return { ...state, loadingAddToQueue: false };
    case "stopLoadingWatchedList":
      return { ...state, loadingAddToWatchedList: false };
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

  const [{ loadingAddToQueue, loadingAddToWatchedList }, dispatch] = useReducer(
    reducer,
    { loadingAddToQueue: false, loadingAddToWatchedList: false }
  );
  const { media, communityId } = innerProps;

  const fetcher = (url: string) => fetch(url).then((r) => r.json());
  const { data, isLoading } = useSwr<TMDBMedia>(
    buildTMDBQuery(`${innerProps.media.mediaType}/${innerProps.media.tmdbId}`),
    fetcher
  );

  const addToList = async (media: TMDBMedia, watched: boolean) => {
    const watchedText = watched ? "watched list" : "queue";
    try {
      dispatch({ type: watched ? "isLoadingWatchedList" : "isLoadingQueue" });
      const { res, data } = await addMediaToList(
        { ...media, media_type: innerProps.media.title },
        communityId,
        watched
      );
      if (res.ok) {
        Notify.success(`Added ${data.media.title} to ${watchedText}`);
      } else {
        throw new Error(
          `Could not add ${
            media.title ?? media.name ?? media.original_title
          } to ${watchedText}`
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
      <Text>Media Modal</Text>
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
            <Stack>
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
                <Tooltip label="Move to watched list">
                  <ActionIcon
                    variant="filled"
                    loading={loadingAddToWatchedList}
                    onClick={() => addToList(data!, true)}
                  >
                    <IconBookmark />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Move to queue">
                  <ActionIcon
                    variant="filled"
                    loading={loadingAddToQueue}
                    onClick={() => addToList(data!, false)}
                  >
                    <IconList />
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
