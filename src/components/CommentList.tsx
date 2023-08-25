import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

import { Comment, SkeletonComment } from ".";
import { useCommentContext } from "@/context/CommentProvider";
import { Stack, Button, Group } from "@mantine/core";
import { useState } from "react";
import { CommentTextEditor } from ".";
import { useSession } from "next-auth/react";
import { createComment } from "@/services/comments";
import useAsyncFn from "@/lib/hooks/useAsyncFn";

interface CommentListProps {
  children?: React.ReactNode;
}

// Should load more comments as needed
function CommentList({ children }: CommentListProps) {
  const [commentContent, setCommentContent] = useState<string>("");
  const { comments, loadingComments, context, addNewComment } =
    useCommentContext();
  const { data: session } = useSession();

  const createCommentFn = useAsyncFn(createComment);

  const onCommentCreate = async () => {
    if (commentContent != "") {
      const comment = await createCommentFn.execute({
        ...context,
        text: commentContent,
      });
      addNewComment(comment);
    }
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
          loading={createCommentFn.loading}
          onClick={onCommentCreate}
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
              {...c}
              id={c.id}
              date={dayjs().to(dayjs(c.updatedAt))}
              body={c.body}
              author={c.user}
              isOwner={session ? c.userId === session!.user!.id : false}
            />
          ))}
        </>
      )}
    </Stack>
  );
}

export default CommentList;
