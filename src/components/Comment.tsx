import { CommentWithUser, useCommentContext } from "@/context/CommentProvider";
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
  Skeleton,
  Box,
  Space,
} from "@mantine/core";
import { useDisclosure, useHover } from "@mantine/hooks";
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { useSession } from "next-auth/react";
import { useState } from "react";
import CommentTextEditor from "./CommentTextEditor";

import {
  createComment,
  updateComment,
  deleteComment,
  fetchComments,
} from "@/services/comments";

import useAsyncFn from "@/lib/hooks/useAsyncFn";

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
  date: any;
  body: string;
  author: {
    name: string;
    image: string;
  };
  isOwner?: boolean;
  _count: {
    likes: number;
    children: number;
  };
}

function Comment({ id, date, body, author, isOwner, _count }: CommentProps) {
  isOwner = isOwner ?? false;

  const { classes } = useStyles();

  const [openReply, replyControl] = useDisclosure(false);
  const [openShowReplies, repliesControl] = useDisclosure(false);
  const [toggleEditComment, editCommentControl] = useDisclosure(false);

  const { hovered, ref } = useHover();
  const { updateComments, removeComment, context } = useCommentContext();

  const [content, setContent] = useState<string>(body);
  const [replyContent, setReplyContent] = useState<string>("");
  const [childComments, setChildComments] = useState<CommentWithUser[]>([]);

  const { data: session } = useSession();

  const updateCommentFn = useAsyncFn(updateComment);
  const createCommentFn = useAsyncFn(createComment);
  const deleteCommentFn = useAsyncFn(deleteComment);
  const fetchCommentsFn = useAsyncFn(fetchComments);

  const onCommentUpdate = async () => {
    try {
      const data = await updateCommentFn.execute({
        ...context,
        commentId: id,
        text: content,
      });
      updateComments(id, data);
      editCommentControl.close();
    } catch (e) {
      return Notify.error("could not edit comment");
    }
  };

  const onCommentReply = async () => {
    try {
      try {
        const comment = await createCommentFn.execute({
          text: replyContent,
          ...context,
          parentId: id,
        });
        const updateCount = {
          _count: { ..._count, children: ++_count.children },
        } as CommentWithUser;

        setChildComments((prev) => [comment, ...prev]);
        updateComments(id, updateCount);
      } catch (e) {
        return Notify.error("could not create a reply");
      }
    } finally {
      setReplyContent("");
      replyControl.close();
    }
  };

  const onShowReplies = async () => {
    if (openShowReplies) {
      repliesControl.close();
      return;
    } else {
      repliesControl.open();
    }

    return fetchCommentsFn
      .execute({ ...context, parentId: id })
      .then((comments) => {
        setChildComments(comments);
      })
      .catch(() => Notify.error("could not load replies"));
  };

  const onDeleteComment = async () => {
    try {
      await deleteCommentFn.execute({
        ...context,
        commentId: id,
      });
      removeComment(id);
    } catch (e) {}
  };

  return (
    <Flex gap="sm" ref={ref}>
      <Avatar src={author.image} alt={author.name} radius="xl" />
      <Stack spacing="none" className={classes.contentContainer}>
        <Text size="md">{author.name}</Text>
        <Text size="xs" color="dimmed">
          {date}
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
                onClick={onCommentUpdate}
                loading={updateCommentFn.loading}
              >
                Save
              </Button>
            </Group>
          </div>
        ) : (
          <Spoiler maxHeight={100} showLabel="Read more" hideLabel="Show less">
            <TypographyStylesProvider>
              {deleteCommentFn.loading ? (
                <div>
                  <Skeleton height={8} radius="xl" />
                  <Skeleton height={8} mt={6} radius="xl" />
                  <Skeleton height={8} mt={6} width="70%" radius="xl" />
                </div>
              ) : (
                <div
                  className={classes.content}
                  dangerouslySetInnerHTML={{ __html: body }}
                />
              )}
            </TypographyStylesProvider>
          </Spoiler>
        )}

        {/*
        <Box>
          <Group>
            <Button
              color="gray"
              compact
              variant="subtle"
              onClick={replyControl.open}
            >
              Reply
            </Button>
          </Group>
          <Collapse in={openReply}>
            <Stack>
              <CommentTextEditor
                content={replyContent}
                setContent={setReplyContent}
              />
              <Group position="right">
                <Button
                  variant="subtle"
                  color="gray"
                  onClick={replyControl.close}
                >
                  Cancel
                </Button>
                <Button
                  variant="light"
                  onClick={onCommentReply}
                  loading={createCommentFn.loading}
                >
                  Comment
                </Button>
              </Group>
            </Stack>
          </Collapse>

          {_count.children > 0 && (
            <Button
              onClick={onShowReplies}
              leftIcon={
                fetchCommentsFn.loading ? (
                  <IconChevronUp size="1rem" />
                ) : (
                  <IconChevronDown size="1rem" />
                )
              }
              loading={fetchCommentsFn.loading}
              variant="subtle"
            >
              {_count.children} {_count.children === 1 ? "reply" : "replies"}
            </Button>
          )}

          {_count.children > 0 &&
            openShowReplies &&
            childComments.map((c) => (
              <Comment
                key={c.id}
                {...c}
                id={c.id}
                date={dayjs().to(dayjs(c.updatedAt))}
                body={c.body}
                author={c.user}
                isOwner={session ? c.userId === session!.user!.id : false}
              />
            ))}
        </Box>
          */}
      </Stack>

      <Menu shadow="md" width={200}>
        <Menu.Target>
          {hovered && isOwner && !toggleEditComment ? (
            <ActionIcon>
              <IconDotsVertical />
            </ActionIcon>
          ) : (
            <Space w="1.7rem" />
          )}
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
            onClick={onDeleteComment}
          >
            Delete
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Flex>
  );
}

export default Comment;
