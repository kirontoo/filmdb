import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

import { Comment, SkeletonComment } from ".";
import { useCommentContext } from "@/context/CommentProvider";
import { Stack, useMantineTheme, Button, Group } from "@mantine/core";
import { useState } from "react";
import { CommentTextEditor } from ".";

interface CommentListProps {
  children?: React.ReactNode;
}

// Should load more comments as needed
function CommentList({ children }: CommentListProps) {
  const theme = useMantineTheme();
  const [commentContent, setCommentContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { comments, createComment, loadingComments } = useCommentContext();

  const createNewComment = async () => {
    setIsLoading(true);
    await createComment(commentContent);
    setIsLoading(false);
  };

  return (
    <Stack spacing="xs">
      <CommentTextEditor
        content={commentContent}
        setContent={setCommentContent}
      />
      <Group position="right">
        <Button
          variant="light"
          size="sm"
          loading={isLoading}
          onClick={createNewComment}
        >
          Comment
        </Button>
      </Group>
      {loadingComments ? (
        <>
          <SkeletonComment />
          <SkeletonComment />
        </>
      ) : (
        <>
          {children}

          {comments.map((c) => (
            <Comment
              key={c.id}
              createdAt={dayjs().to(dayjs(c.createdAt))}
              body={c.body}
              author={c.user}
            />
          ))}
        </>
      )}

      <Group position="center">
        <Button color={theme.primaryColor} tt="capitalize" variant="subtle">
          View More Comments
        </Button>
      </Group>
    </Stack>
  );
}

export default CommentList;
