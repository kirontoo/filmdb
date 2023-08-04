import {
  Container,
  createStyles,
  Text,
  rem,
  Button,
  Group,
  Stack,
  Title,
  Collapse,
  Box,
  Divider,
  LoadingOverlay,
} from "@mantine/core";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useListState, useDisclosure } from "@mantine/hooks";
import { Media, User } from "@prisma/client";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Notify from "@/lib/notify";
import Head from "next/head";
import { CommunityForm } from "@/components";
import { IconEdit } from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import useAsyncFn from "@/lib/hooks/useAsyncFn";
import { fetchCommunityWithMedia } from "@/services/medias";
import { useLoadingContext } from "@/context/LoadingProvider";

type MediaWithRequester = {
  requestedBy: User;
} & Media;

const useStyles = createStyles((theme) => ({
  container: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  item: {
    ...theme.fn.focusStyles(),
    display: "flex",
    alignItems: "center",
    borderRadius: theme.radius.md,
    border: `${rem(1)} solid ${
      theme.colorScheme === "dark" ? theme.colors.dark[5] : theme.colors.gray[2]
    }`,
    padding: `${theme.spacing.sm} ${theme.spacing.xl}`,
    backgroundColor:
      theme.colorScheme === "dark" ? theme.colors.dark[5] : theme.white,
    marginBottom: theme.spacing.sm,
  },

  itemDragging: {
    boxShadow: theme.shadows.sm,
  },

  queueContainer: {},

  position: {
    fontSize: rem(30),
    fontWeight: 700,
    width: rem(60),
  },
}));

function ManageCommunitySlug() {
  const router = useRouter();
  const { slug } = router.query;
  const [savingQueue, setSavingQueue] = useState<boolean>(false);
  const { classes, cx } = useStyles();
  const [queuedMedia, handlers] = useListState<MediaWithRequester>([]);
  const [openedQueueForm, { toggle: toggleQueueForm }] = useDisclosure(false);
  const [
    openedCommunityForm,
    { close: closeCommunityForm, toggle: toggleCommunityForm },
  ] = useDisclosure(false);
  const { data: session } = useSession();
  const fetchCommunityWithMediaFn = useAsyncFn(fetchCommunityWithMedia);
  const { isLoading } = useLoadingContext();

  useEffect(() => {
    if (session && !isLoading) {
      onLoadData();
    }
  }, [slug, session, isLoading]);

  async function onLoadData() {
    try {
      const cSlug = Array.isArray(slug) ? slug[0] : slug;
      if (cSlug) {
        const community = await fetchCommunityWithMediaFn.execute({
          slug: cSlug,
        });
        const filteredMedia = community.medias.filter(
          (m: Media) => !m.watched
        ) as MediaWithRequester[];
        handlers.setState(filteredMedia);
      }
    } catch (e) {}
  }

  const saveQueue = async () => {
    try {
      setSavingQueue(true);
      const mediaToSave = queuedMedia.map((m, index) => ({
        id: m.id,
        queue: index + 1,
      }));
      const communitySlug = Array.isArray(slug) ? slug[0] : slug;
      const res = await fetch(`/api/community/${communitySlug}/media`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ medias: mediaToSave }),
      });
      if (!res.ok) {
        // const { data } = await res.json();
        throw new Error("could not update queue");
      }
      Notify.success("Queue updated!");
    } catch (error) {
      Notify.error("Could not update queue");
    } finally {
      setSavingQueue(false);
    }
  };

  const items = queuedMedia.map((item: MediaWithRequester, index) => (
    <Draggable key={item.id} index={index} draggableId={item.id}>
      {(provided, snapshot) => (
        <div
          className={cx(classes.item, {
            [classes.itemDragging]: snapshot.isDragging,
          })}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
        >
          <Text className={classes.position}>{index + 1}</Text>
          <div>
            <Text>{item.title}</Text>
            <Text>{item.requestedBy?.name ?? ""}</Text>
          </div>
        </div>
      )}
    </Draggable>
  ));

  function DndList({ children }: DndListProps) {
    return (
      <DragDropContext
        onDragEnd={(data) => {
          const { destination, source } = data;
          handlers.reorder({ from: source.index, to: destination?.index || 0 });
        }}
      >
        <Droppable droppableId="dnd-list" direction="vertical">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {children}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  }

  if (fetchCommunityWithMediaFn.loading || isLoading) {
    return (
      <LoadingOverlay
        visible={fetchCommunityWithMediaFn.loading}
        overlayBlur={2}
      />
    );
  }

  if (!fetchCommunityWithMediaFn.value) {
    return <Text>Community does not exist</Text>;
  }

  return (
    <>
      <Head>
        <title>
          {`${
            fetchCommunityWithMediaFn.value &&
            fetchCommunityWithMediaFn.value.name
          }`}{" "}
          | FilmDB
        </title>
      </Head>
      <Container className={classes.container}>
        <Stack>
          <Title tt="capitalize">{fetchCommunityWithMediaFn.value.name}</Title>
          <Divider />
          <Group position="apart">
            <Title order={2} size="h3">
              Community Details
            </Title>
            <Button
              size="xs"
              onClick={toggleCommunityForm}
              leftIcon={<IconEdit size="1rem" />}
            >
              Edit
            </Button>
          </Group>

          <Box>
            <Collapse in={openedCommunityForm}>
              <CommunityForm
                communityId={fetchCommunityWithMediaFn.value.id}
                name={fetchCommunityWithMediaFn.value.name ?? ""}
                description={fetchCommunityWithMediaFn.value.description ?? ""}
                onCancel={closeCommunityForm}
              />
            </Collapse>
          </Box>

          <Box>
            <Group position="apart" mb="md">
              <Title order={2} size="h3">
                Queue
              </Title>
              <Button
                size="xs"
                onClick={toggleQueueForm}
                leftIcon={<IconEdit size="1rem" />}
              >
                Edit
              </Button>
            </Group>

            <Collapse in={openedQueueForm}>
              {!fetchCommunityWithMediaFn.loading && (
                <Container size="xs">
                  <DndList>{items}</DndList>

                  <Group position="right">
                    <Button loading={savingQueue} onClick={saveQueue}>
                      Save Queue
                    </Button>
                  </Group>
                </Container>
              )}
            </Collapse>
          </Box>
        </Stack>
      </Container>
    </>
  );
}

ManageCommunitySlug.auth = {
  unauthorized: "/auth/signin",
};

export default ManageCommunitySlug;

interface DndListProps {
  children: React.ReactNode;
}
