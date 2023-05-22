import Notify from "@/lib/notify";
import { Comment } from "@prisma/client";
import {
  useState,
  useContext,
  createContext,
  ReactNode,
  useEffect,
} from "react";

export type CommentWithUser = {
  user: {
    name: string;
    image: string;
  };
} & Comment;

interface CommentState {
  comments: CommentWithUser[];
  loadingComments: boolean;
  addNewComment: (c: CommentWithUser) => void;
  createComment: (t: string) => Promise<void>;
  deleteComment: (t: string) => Promise<void>;
  editComment: (t: string, _: string) => Promise<void>;
}

export const CommentContext = createContext<CommentState>({
  comments: [],
  loadingComments: false,
  addNewComment: (_: CommentWithUser) => null,
  createComment: async (_: string) => {
    return new Promise((resolve) => {
      resolve();
    });
  },
  deleteComment: async (_: string) => {
    return new Promise((resolve) => {
      resolve();
    });
  },
  editComment: async (t: string, _: string) => {
    return new Promise((resolve) => {
      resolve();
    });
  },
});

export const useCommentContext = () => {
  let context = useContext(CommentContext);
  if (context === undefined) {
    throw new Error("useCommentContext must be used within a CommentProvider");
  }
  return context;
};

export const useCommentProvider = (communityId: string, mediaId: string) => {
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [loadingComments, setLoadingComments] = useState<boolean>(false);

  useEffect(() => {
    if (communityId !== undefined && mediaId !== undefined) {
      loadComments();
    }
  }, []);

  const loadComments = async () => {
    try {
      setLoadingComments(true);
      const res = await fetch(
        `/api/community/${communityId}/media/${mediaId}/comments`
      );

      if (res.ok) {
        const { data } = await res.json();
        setComments(data.comments);
      }
    } catch (e) {
    } finally {
      setLoadingComments(false);
    }
  };

  const addNewComment = (c: CommentWithUser) => null;

  const createComment = async (text: string, parentId?: string) => {
    try {
      const res = await fetch(
        `/api/community/${communityId}/media/${mediaId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            body: text,
            mediaId,
            parentId: parentId ? parentId : null,
          }),
        }
      );

      if (res.ok) {
        const { data } = await res.json();
        setComments((s) => [data.comment, ...s]);
      }
    } catch (e) {
      Notify.error("Sorry! Something went wrong!", "Please try again.");
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const res = await fetch(
        `/api/community/${communityId}/media/${mediaId}/comments/${commentId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        // filter out the comment
        const newCommentItems = comments.filter((c) => c.id !== commentId);
        setComments([...newCommentItems]);
      }
    } catch (e) {
      throw e;
    }
  };

  const editComment = async (commentId: string, body: string) => {
    try {
      const res = await fetch(
        `/api/community/${communityId}/media/${mediaId}/comments/${commentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            body: body,
          }),
        }
      );

      if (res.ok) {
        // update comment

        const { data } = await res.json();

        const index = comments.findIndex((m) => m.id === commentId);
        if (index === -1) {
          // don't update anything if it doesn't exist
          return;
        }
        let foundComment = comments[index];
        const newCommentItems = comments.filter((m) => m.id !== commentId);

        // merge comment data
        setComments([
          ...newCommentItems.slice(0, index),
          { ...foundComment, ...data.comment },
          ...newCommentItems.slice(index),
        ]);
      } else {
        throw new Error("request failed");
      }
    } catch (e) {
      throw e;
    }
  };

  return {
    comments,
    loadingComments,
    addNewComment,
    createComment,
    deleteComment,
    editComment,
  };
};

interface CommentProviderProps {
  children: ReactNode;
  communityId: string;
  mediaId: string;
}

export const CommentProvider = ({
  children,
  communityId,
  mediaId,
}: CommentProviderProps) => {
  let value = useCommentProvider(communityId, mediaId);
  return (
    <CommentContext.Provider value={value}>{children}</CommentContext.Provider>
  );
};
