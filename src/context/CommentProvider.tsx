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
  _count: {
    likes: number;
    children: number;
  };
} & Comment;

interface CommentState {
  comments: CommentWithUser[];
  loadingComments: boolean;
  addNewComment: (c: CommentWithUser) => void;
  createComment: (t: string, i?: string) => Promise<CommentWithUser>;
  deleteComment: (t: string) => Promise<void>;
  editComment: (_: string, _b: string) => Promise<void>;
  fetchReplies: (_: string) => Promise<CommentWithUser[]>;
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
  editComment: async (_: string, _b: string) => {
    return new Promise((resolve) => {
      resolve();
    });
  },
  fetchReplies: async (_: string) => {
    return new Promise((resolve) => {
      resolve([]);
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

export const useCommentProvider = (cId: string, mId: string) => {
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [loadingComments, setLoadingComments] = useState<boolean>(false);

  useEffect(() => {
    if (cId !== undefined && mId !== undefined) {
      loadComments();
    }
  }, []);

  const loadComments = async () => {
    try {
      setLoadingComments(true);
      const res = await fetch(
        `/api/community/${cId}/media/${mId}/comments`
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

  const fetchReplies = async (parentId: string) => {
    try {
      const res = await fetch(
        `/api/community/${cId}/media/${mId}/comments?parentId=${parentId}`
      );

      if (res.ok) {
        const { data } = await res.json();
        return data.comments;
      }
      return [];
    } catch (e) {
      throw new Error("could not fetch replies");
    }
  };

  const addNewComment = (c: CommentWithUser) => null;

  const createComment = async (text: string, parentId?: string) => {
    try {
      const res = await fetch(
        `/api/community/${cId}/media/${mId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            body: text,
            mediaId: mId,
            parentId: parentId ? parentId : null,
          }),
        }
      );

      if (res.ok && !parentId) {
        const { data } = await res.json();
        setComments((s) => [data.comment, ...s]);
        return data.comment;
      } else if (res.ok && parentId) {
        const { data } = await res.json();
        const index = comments.findIndex((c) => c.id === parentId);
        const foundComment = comments[index];
        const updatedComment = {
          ...foundComment,
          _count: {
            ...foundComment._count,
            children: ++foundComment._count.children,
          },
        };

        const newCommentItems = comments.filter((c) => c.id !== parentId);

        // merge comment data
        setComments([
          ...newCommentItems.slice(0, index),
          { ...foundComment, ...updatedComment },
          ...newCommentItems.slice(index),
        ]);

        return data.comment;
      }
    } catch (e) {
      Notify.error("Sorry! Something went wrong!", "Please try again.");
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const res = await fetch(
        `/api/community/${cId}/media/${mId}/comments/${commentId}`,
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
        `/api/community/${cId}/media/${mId}/comments/${commentId}`,
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
    fetchReplies,
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
