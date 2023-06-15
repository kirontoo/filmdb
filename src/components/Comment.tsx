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

import { updateComment } from "@/services/comments";

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
  const { classes } = useStyles();
  const [openReply, replyControl] = useDisclosure(false);
  const [openShowReplies, repliesControl] = useDisclosure(false);

  const { hovered, ref } = useHover();
  isOwner = isOwner ?? false;

  const {
    deleteComment,
    updateComments,
    createComment,
    fetchReplies,
    context,
  } = useCommentContext();
  const [toggleEditComment, editCommentControl] = useDisclosure(false);
  const [content, setContent] = useState<string>(body);
  const [replyContent, setReplyContent] = useState<string>("");

  // loading states
  const [updatingComment, setUpdatingComment] = useState<boolean>(false);
  const [deletingComment, setDeletingComment] = useState<boolean>(false);
  const [replyingComment, setReplyingComment] = useState<boolean>(false);
  const [loadingReplies, setLoadingReplies] = useState<boolean>(false);
  const [childComments, setChildComments] = useState<CommentWithUser[]>([]);
  const { data: session } = useSession();

  const onUpdateComment = async () => {
    try {
      setUpdatingComment(true);
      const updatedComment = await updateComment({
        ...context,
        commentId: id,
        text: content,
      });
      updateComments(updatedComment);
      editCommentControl.close();
    } catch (e) {
      Notify.error("request failed");
    } finally {
      setUpdatingComment(false);
    }
  };

  const onReplyToComment = async () => {
    try {
      setReplyingComment(true);
      const comment = await createComment(replyContent, id);
      if (childComments.length > 0) {
        setChildComments((prev) => [...prev, comment]);
      }
    } catch (e) {
    } finally {
      setReplyContent("");
      setReplyingComment(false);
      replyControl.close();
    }
  };

  const showReplies = async () => {
    if (openShowReplies) {
      repliesControl.close();
      return;
    } else {
      repliesControl.open();
    }

    try {
      setLoadingReplies(true);
      const comments = await fetchReplies(id);
      setChildComments(comments);
    } catch (e) {
      console.log("fetching replies", e);
    } finally {
      setLoadingReplies(false);
    }
  };

  const onDeleteComment = async () => {
    try {
      setDeletingComment(true);
      await deleteComment(id);
    } catch (e) {
    } finally {
      setDeletingComment(false);
    }
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
                onClick={onUpdateComment}
                loading={updatingComment}
              >
                Save
              </Button>
            </Group>
          </div>
        ) : (
          <Spoiler maxHeight={100} showLabel="Read more" hideLabel="Show less">
            <TypographyStylesProvider>
              {deletingComment ? (
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
                  onClick={onReplyToComment}
                  loading={replyingComment}
                >
                  Comment
                </Button>
              </Group>
            </Stack>
          </Collapse>

          {_count.children > 0 && (
            <Button
              onClick={showReplies}
              leftIcon={
                openShowReplies ? (
                  <IconChevronUp size="1rem" />
                ) : (
                  <IconChevronDown size="1rem" />
                )
              }
              loading={loadingReplies}
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
