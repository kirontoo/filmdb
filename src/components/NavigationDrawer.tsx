import { useSession, signOut } from "next-auth/react";
import {
  CommunityWithMembers,
  useCommunityContext,
} from "@/context/CommunityProvider";
import {
  NavLink,
  Box,
  Flex,
  Text,
  rem,
  Avatar,
  Drawer,
  DrawerProps,
  Stack,
  Title,
  UnstyledButton,
  createStyles,
  Divider,
} from "@mantine/core";
import {
  Icon,
  IconChevronDown,
  IconGlobe,
  IconInfoCircle,
  IconLogin,
  IconLogout,
  IconMoodPlus,
  IconPencilPlus,
  IconUsers,
} from "@tabler/icons-react";
import { useRouter } from "next/router";

interface ProfileDrawerProps extends DrawerProps {}
interface ProfileBtns {
  icon: Icon;
  label: string;
  onClick: () => void;
  default: boolean;
}

const useStyles = createStyles(() => ({
  communityButton: {
    display: "flex",
    alignItems: "center",
    gap: rem(8),
  },
  drawer: {
    backgroundColor: "black",
    color: "white",
  },

  root: {
    backgroundColor: "black",
  },
}));

function NavigationDrawer({ opened, onClose, ...rest }: ProfileDrawerProps) {
  const { data: session } = useSession();
  const { classes } = useStyles();
  const { currentCommunity } = useCommunityContext();
  const router = useRouter();

  const btns: ProfileBtns[] = [
    {
      icon: IconGlobe,
      label: "Discover",
      onClick: () => {
        router.push("/");
        onClose();
      },
      default: true,
    },
    {
      icon: IconPencilPlus,
      label: "Create a Community",
      onClick: () => {
        router.push("/community/new");
        onClose();
      },
      default: true,
    },
    {
      icon: IconUsers,
      label: "Manage Communities",
      onClick: () => {
        router.push("/community");
        onClose();
      },
      default: false,
    },
    {
      icon: IconMoodPlus,
      label: "Join a Community",
      onClick: () => {
        router.push("/community/join");
        onClose();
      },
      default: true,
    },
    {
      icon: IconLogout,
      label: "Log Out",
      onClick: () => {
        signOut({ callbackUrl: "/auth/signin" });
        onClose();
      },
      default: false,
    },
  ];

  const DrawerTitle = ({
    communityName: community,
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
              <Title>Welcome {name.split(" ")[0]}</Title>
            </>
          )}
          <UnstyledButton className={classes.communityButton}>
            <Text size="xs" tt="capitalize">
              {community && community.name}&apos;s Watch Party
            </Text>
            <IconChevronDown size="1.1rem" />
          </UnstyledButton>
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
          {btns.map((b) => {
            if (b.default == true) {
              return (
                <NavLink
                  sx={{ color: "white" }}
                  key={b.label}
                  label={b.label}
                  icon={<b.icon />}
                  onClick={b.onClick}
                />
              );
            } else {
              if (session) {
                return (
                  <NavLink
                    sx={{ color: "white" }}
                    key={b.label}
                    label={b.label}
                    icon={<b.icon />}
                    onClick={b.onClick}
                  />
                );
              }
            }
          })}
          {!session && (
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
          <Divider />
          <NavLink
            sx={{ color: "white" }}
            label="About us"
            icon={<IconInfoCircle />}
          />
        </Stack>
      </Drawer>
    </>
  );
}

export default NavigationDrawer;
