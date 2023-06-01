import {
  Container,
  createStyles,
  Text,
  rem,
  Button,
  Group,
} from "@mantine/core";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useListState } from "@mantine/hooks";
import { Media, User } from "@prisma/client";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Notify from "@/lib/notify";
import { useCommunityContext } from "@/context/CommunityProvider";

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

  position: {
    fontSize: rem(30),
    fontWeight: 700,
    width: rem(60),
  },
}));

function ManageCommunitySlug() {
  const router = useRouter();
  const { slug } = router.query;
  const [isLoading, setLoading] = useState<boolean>(false);
  const [savingQueue, setSavingQueue] = useState<boolean>(false);
  const { currentCommunity } = useCommunityContext();
  const { classes, cx } = useStyles();
  const [queuedMedia, handlers] = useListState<MediaWithRequester>([]);

  useEffect(() => {
    if (currentCommunity) {
      router.push(`/community/manage/${currentCommunity.slug}`);
    }
  }, [currentCommunity]);

  useEffect(() => {
    loadData();
  }, [slug]);

  async function loadData() {
    setLoading(true);
    try {
      const communitySlug = Array.isArray(slug) ? slug[0] : slug;
      if (communitySlug) {
        const res = await fetch(`/api/community/${communitySlug}/media`);
        if (res.ok) {
          const { data } = await res.json();
          const media = data.medias.filter((m: Media) => !m.watched);
          handlers.setState(media);
        } else {
          throw new Error("community does not exist");
        }
      }
    } catch (e) {
      router.push("/404");
    } finally {
      setLoading(false);
    }
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
    } catch (error) {
      Notify.error("could not update queue");
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

  return (
    <Container className={classes.container}>
      {!isLoading && (
        <Container size="xs">
          <DndList>{items}</DndList>

          <Group position="right">
            <Button loading={savingQueue} onClick={saveQueue}>
              Save Queue
            </Button>
          </Group>
        </Container>
      )}
    </Container>
  );
}

ManageCommunitySlug.auth = {
  unauthorized: "/auth/signin",
};

export default ManageCommunitySlug;

interface DndListProps {
  children: React.ReactNode;
}
