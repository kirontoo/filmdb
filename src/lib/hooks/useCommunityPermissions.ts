import { CommunityWithMembers, useCommunityContext } from "@/context/CommunityProvider";
import { useSession } from "next-auth/react";
import { useMemo } from "react";

// Usage:
// returns all communities that the user owns (they created it)
// and has the permission to update a community
export default function useCommunityPermissions() : CommunityWithMembers[] {
  const { data: session } = useSession();
  const { communities } = useCommunityContext();
  const ownedCommunities = useMemo(() => {
    return communities.filter((c) => c.createdBy === session!.user!.id);
  }, [session, communities]);

  return ownedCommunities;
}
