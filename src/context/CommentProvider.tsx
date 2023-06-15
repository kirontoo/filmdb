import Notify from "@/lib/notify";
import { updateComment } from "@/services/comments";
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
  context: {
    communityId: string;
    mediaId: string;
  };
  loadingComments: boolean;
  addNewComment: (c: CommentWithUser) => void;
  removeComment: (t: string) => void;
  updateComments: (_id: string, _: CommentWithUser) => void;
  fetchReplies: (_: string) => Promise<CommentWithUser[]>;
}

export const CommentContext = createContext<CommentState>({
  comments: [],
  context: {
    communityId: "",
    mediaId: "",
  },
  loadingComments: false,
  addNewComment: (_: CommentWithUser) => null,
  removeComment: async (_: string) => null,
  updateComments: async (_id: string, _: CommentWithUser) => null,
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
      const res = await fetch(`/api/community/${cId}/media/${mId}/comments`);

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

  const addNewComment = async (c: CommentWithUser) => {
    if (!c.parentId) {
      setComments((s) => [c, ...s]);
    } else {
      const index = comments.findIndex((c) => c.id === c.parentId);
      updateComments(comments[index].id, {
        _count: {
          ...comments[index]._count,
          children: ++comments[index]._count.children,
        },
      });
    }
  };

  const removeComment = async (commentId: string) => {
    const newCommentItems = comments.filter((c) => c.id !== commentId);
    setComments([...newCommentItems]);
  };

  const updateComments = async (
    id: string,
    updatedComment: Partial<CommentWithUser>
  ) => {
    const index = comments.findIndex((m) => m.id === id);
    if (index === -1) {
      // don't update anything if it doesn't exist
      return;
    }
    let foundComment = comments[index];
    const newCommentItems = comments.filter((m) => m.id !== id);

    // merge comment data
    setComments([
      ...newCommentItems.slice(0, index),
      { ...foundComment, ...updatedComment },
      ...newCommentItems.slice(index),
    ]);
  };

  return {
    comments,
    loadingComments,
    addNewComment,
    removeComment,
    updateComments,
    fetchReplies,
    context: {
      communityId: cId,
      mediaId: mId,
    },
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
