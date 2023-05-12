import { Avatar, Tooltip } from "@mantine/core";

interface MemberListProps {
  showcase?: number;
  members: { name: string; image: string }[];
}

/*
 * @props showcase- number of avatars to show
 * @props members - list of community members
 */
export default function AvatarMemberList({ showcase, members }: MemberListProps) {
  const count = showcase ?? 5;
  const AvatarImageOrName = (member: { name: string; image: string }) => {
    return (
      <Tooltip label={member.name} withArrow key={member.name}>
        <Avatar src={member.image ?? ""} radius="xl">
          {member.name[0]}
        </Avatar>
      </Tooltip>
    );
  };
  return (
    <Tooltip.Group openDelay={300} closeDelay={100}>
      <Avatar.Group spacing="sm">
        <>
          {members.length < count
            ? members.map(AvatarImageOrName)
            : members
                .slice(0, Math.min(4, members.length))
                .map(AvatarImageOrName)}
          {members.length > count - 1 && (
            <Avatar radius="xl">+{members.length - (count - 1)}</Avatar>
          )}
        </>
      </Avatar.Group>
    </Tooltip.Group>
  );
}
