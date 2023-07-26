import { useSession, signOut } from "next-auth/react";
import {
  CommunityWithMembers,
  useCommunityContext,
} from "@/context/CommunityProvider";
import {
  NavLink,
  Box,
  Flex,
  Avatar,
  Stack,
  Title,
  Divider,
} from "@mantine/core";
import { IconLogin, IconLogout, IconMoodPlus } from "@tabler/icons-react";
import { useRouter } from "next/router";
import { useNavContext } from "@/context/NavProvider";

function ProfileAside() {
  const { data: session } = useSession();
  const { communities, currentCommunity } = useCommunityContext();
  const { asideSidebarControls } = useNavContext();
  const router = useRouter();

  const SidebarTitle = ({
    name,
    image,
  }: {
    communityName: CommunityWithMembers | null;
    name: string;
    image: string | null;
  }) => {
    return (
      <Flex gap="sm" align="center">
        {session && (
          <Avatar
            size="md"
            src={
              image ?? `https://ui-avatars.com/api/?name=${encodeURI(name[0])}`
            }
            radius="xl"
          >
            {name[0]}
          </Avatar>
        )}
        <Box>
          {session && (
            <>
              <Title order={1} fz="lg">{name}</Title>
            </>
          )}
        </Box>
      </Flex>
    );
  };

  return (
    <Stack justify="space-between" p={16}>
      {session ? (
        <SidebarTitle
          name={session!.user!.name}
          image={session!.user!.image}
          communityName={currentCommunity}
        />
      ) : (
        <Title>Filmdb</Title>
      )}

      <Divider />
      <Title order={2} fz="md">
        My Groups
      </Title>
      {communities.map((c) => (
        <NavLink
          key={c.id}
          icon={
            <Avatar color="gray" radius="xl" size="sm" variant="outline">
              {c.name[0].toUpperCase()}
            </Avatar>
          }
          label={c.name}
          onClick={() => {
            router.push(`/community/${c.slug}`);
            asideSidebarControls.close();
          }}
        />
      ))}
      <NavLink
        icon={<IconMoodPlus />}
        label="Join a Community"
        onClick={() => {
          router.push("/community/join");
          asideSidebarControls.close();
        }}
      />
      <Divider />

      {session ? (
        <NavLink
          sx={{ color: "white" }}
          label="Logout"
          icon={<IconLogout />}
          onClick={() => {
            signOut({ callbackUrl: "/auth/signin" });
            asideSidebarControls.close();
          }}
        />
      ) : (
        <NavLink
          sx={{ color: "white" }}
          label="Login"
          icon={<IconLogin />}
          onClick={() => {
            router.push("/auth/signin");
            asideSidebarControls.close();
          }}
        />
      )}
    </Stack>
  );
}

export default ProfileAside;
