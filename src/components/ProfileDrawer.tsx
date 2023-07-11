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
  Drawer,
  DrawerProps,
  Stack,
  Title,
  createStyles,
  Divider,
} from "@mantine/core";
import { IconLogin, IconLogout, IconMoodPlus } from "@tabler/icons-react";
import { useRouter } from "next/router";

interface ProfileDrawerProps extends DrawerProps {}

const useStyles = createStyles(() => ({
  drawer: {
    backgroundColor: "black",
    color: "white",
  },
}));

function ProfileDrawer({ opened, onClose, ...rest }: ProfileDrawerProps) {
  const { data: session } = useSession();
  const { classes } = useStyles();
  const { communities, currentCommunity } = useCommunityContext();
  const router = useRouter();

  const DrawerTitle = ({
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
            size="lg"
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
              <Title>{name}</Title>
            </>
          )}
        </Box>
      </Flex>
    );
  };

  return (
    <>
      <Drawer
        classNames={{
          body: classes.drawer,
          header: classes.drawer,
          content: classes.drawer,
        }}
        opened={opened}
        onClose={onClose}
        {...rest}
        title={
          session ? (
            <DrawerTitle
              name={session!.user!.name}
              image={session!.user!.image}
              communityName={currentCommunity}
            />
          ) : (
            <Drawer.Title>Filmdb</Drawer.Title>
          )
        }
        closeButtonProps={{ "aria-label": "Close profile modal", iconSize: 32 }}
      >
        <Stack justify="space-between">
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
                onClose();
              }}
            />
          ))}
          <NavLink
            icon={<IconMoodPlus />}
            label="Join a Community"
            onClick={() => {
              router.push("/community/join");
              onClose();
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
                onClose();
              }}
            />
          ) : (
            <NavLink
              sx={{ color: "white" }}
              label="Login"
              icon={<IconLogin />}
              onClick={() => {
                router.push("/auth/signin");
                onClose();
              }}
            />
          )}
        </Stack>
      </Drawer>
    </>
  );
}

export default ProfileDrawer;
