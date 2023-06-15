import { CommentWithUser } from "@/context/CommentProvider";

export async function createComment({
  text,
  communityId,
  mediaId,
  parentId,
}: {
  text: string;
  communityId: string;
  mediaId: string;
  parentId?: string;
}): Promise<CommentWithUser> {
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

    const data = await res.json();

    if (res.ok) {
      return data.data.comment;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    return await Promise.reject(error ?? "Error");
  }
}

export async function deleteComment({
  communityId,
  mediaId,
  commentId,
}: {
  communityId: string;
  mediaId: string;
  commentId: string;
}): Promise<CommentWithUser[]> {
  try {
    const res = await fetch(
      `/api/community/${communityId}/media/${mediaId}/comments/${commentId}`,
      { method: "DELETE" }
    );

    if (res.ok) {
      const { data } = await res.json();
      return data.comments;
    }
    return [];
  } catch (e) {
    return await Promise.reject(e ?? "Error");
  }
}

export async function updateComment({
  communityId,
  mediaId,
  commentId,
  text,
}: {
  text: string;
  communityId: string;
  mediaId: string;
  commentId: string;
}): Promise<CommentWithUser> {
  try {
    const res = await fetch(
      `/api/community/${communityId}/media/${mediaId}/comments/${commentId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body: text,
        }),
      }
    );

    const data = await res.json();
    if (res.ok) {
      return data.data.comment;
    } else {
      throw new Error(data.message);
    }
  } catch (e) {
    return await Promise.reject(e ?? "Error");
  }
}

export async function fetchComments({
  communityId,
  mediaId,
  parentId,
}: {
  communityId: string;
  mediaId: string;
  parentId?: string;
}): Promise<CommentWithUser[]> {
  try {
    const url = `/api/community/${communityId}/media/${mediaId}/comments${
      parentId && `?parentId=${parentId}`
    }`;
    const res = await fetch(url);

    if (res.ok) {
      const { data } = await res.json();
      return data.comments;
    }
    return [];
  } catch (e) {
    throw new Error("could not fetch replies");
  }
}
