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
  createComment: (t: string) => void;
}

export const CommentContext = createContext<CommentState>({
  comments: [],
  loadingComments: false,
  addNewComment: (c: CommentWithUser) => null,
  createComment: async (t: string) => null,
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

  return { comments, loadingComments, addNewComment, createComment };
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
