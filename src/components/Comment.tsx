import { useCommentContext } from "@/context/CommentProvider";
import Notify from "@/lib/notify";
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
import { useState } from "react";
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

  editComment: {
    marginTop: theme.spacing.xs,
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
  const [openReply, replyControl] = useDisclosure(false);
  const { hovered, ref } = useHover();
  isOwner = isOwner ?? false;
  const { deleteComment, editComment } = useCommentContext();
  const [toggleEditComment, editCommentControl] = useDisclosure(false);
  const [content, setContent] = useState<string>(body);
  const [updatingComment, setUpdatingComment] = useState<boolean>(false);

  const updateComment = async () => {
    try {
      setUpdatingComment(true);
      await editComment(id, content);
      editCommentControl.close();
    } catch (e) {
      Notify.error("request failed");
    } finally {
      setUpdatingComment(false);
    }
  };

  return (
    <Flex gap="sm" ref={ref}>
      <Avatar src={author.image} alt={author.name} radius="xl" />
      <Stack spacing="none" className={classes.contentContainer}>
        <Text size="md">{author.name}</Text>
        <Text size="xs" color="dimmed">
          {createdAt}
        </Text>
        {toggleEditComment ? (
          <div className={classes.editComment}>
            <CommentTextEditor content={content} setContent={setContent} />
            <Group position="right" className={classes.editComment}>
              <Button
                compact
                variant="subtle"
                color="gray"
                onClick={editCommentControl.close}
              >
                Cancel
              </Button>
              <Button
                compact
                variant="filled"
                disabled={content == body}
                onClick={updateComment}
                loading={updatingComment}
              >
                Save
              </Button>
            </Group>
          </div>
        ) : (
          <Spoiler maxHeight={100} showLabel="Read more" hideLabel="Show less">
            <TypographyStylesProvider>
              <div
                className={classes.content}
                dangerouslySetInnerHTML={{ __html: body }}
              />
            </TypographyStylesProvider>
          </Spoiler>
        )}
        <Group>
          <Button color="gray" compact variant="subtle" onClick={replyControl.open}>
            Reply
          </Button>
          <Collapse in={openReply}>
            <Stack>
              <CommentTextEditor />
              <Group position="right">
                <Button variant="subtle" color="gray" onClick={replyControl.close}>
                  Cancel
                </Button>
                <Button variant="light">Comment</Button>
              </Group>
            </Stack>
          </Collapse>
        </Group>
      </Stack>
      {hovered && isOwner && !toggleEditComment && (
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <ActionIcon>
              <IconDotsVertical />
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item
              icon={<IconEdit size={14} />}
              onClick={editCommentControl.open}
            >
              Edit
            </Menu.Item>
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
