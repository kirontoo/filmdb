import { useCommentContext } from "@/context/CommentProvider";
import {
  createStyles,
  Text,
  Avatar,
  Group,
  rem,
  Button,
  Spoiler,
  TypographyStylesProvider,
  Collapse,
  Stack,
  Flex,
  ActionIcon,
  Menu,
} from "@mantine/core";
import { useDisclosure, useHover } from "@mantine/hooks";
import { IconDotsVertical, IconEdit, IconTrash } from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import CommentTextEditor from "./CommentTextEditor";

const useStyles = createStyles((theme) => ({
  body: {
    paddingLeft: rem(54),
    paddingTop: theme.spacing.sm,
  },
  actionBar: {
    paddingLeft: rem(54),
  },
  contentContainer: {
    flexGrow: 1,
  },
  content: {
    fontSize: theme.fontSizes.md,
    "& > p:last-child": {
      marginBottom: 0,
    },
  },
  actionBtn: {
    justifySelf: "flex-end",
  },
}));

interface CommentProps {
  id: string;
  createdAt: any;
  body: string;
  author: {
    name: string;
    image: string;
  };
  isOwner?: boolean;
}

function Comment({ id, createdAt, body, author, isOwner }: CommentProps) {
  const { classes } = useStyles();
  const [opened, { open, close }] = useDisclosure(false);
  const { hovered, ref } = useHover();
  isOwner = isOwner ?? false;
  const { deleteComment } = useCommentContext();

  return (
    <Flex gap="sm" ref={ref}>
      <Avatar src={author.image} alt={author.name} radius="xl" />
      <Stack spacing="none" className={classes.contentContainer}>
        <Text size="md">{author.name}</Text>
        <Text size="xs" color="dimmed">
          {createdAt}
        </Text>
        <Spoiler maxHeight={100} showLabel="Read more" hideLabel="Show less">
          <TypographyStylesProvider>
            <div
              className={classes.content}
              dangerouslySetInnerHTML={{ __html: body }}
            />
          </TypographyStylesProvider>
        </Spoiler>
        <Group>
          <Button color="gray" compact variant="subtle" onClick={open}>
            Reply
          </Button>
          <Collapse in={opened}>
            <Stack>
              <CommentTextEditor />
              <Group position="right">
                <Button variant="subtle" color="gray" onClick={close}>
                  Cancel
                </Button>
                <Button variant="light">Comment</Button>
              </Group>
            </Stack>
          </Collapse>
        </Group>
      </Stack>
      {hovered && isOwner && (
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <ActionIcon>
              <IconDotsVertical />
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item icon={<IconEdit size={14} />}>Edit</Menu.Item>
            <Menu.Item
              color="red"
              icon={<IconTrash size={14} />}
              onClick={() => deleteComment(id)}
            >
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      )}
    </Flex>
  );
}

export default Comment;
