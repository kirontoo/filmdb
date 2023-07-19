import { useSession, signOut } from "next-auth/react";
import {
  NavLink,
  Box,
  Flex,
  Avatar,
  Stack,
  Title,
  Divider,
} from "@mantine/core";
import {
  Icon,
  IconGlobe,
  IconInfoCircle,
  IconLogin,
  IconLogout,
  IconMoodPlus,
  IconPencilPlus,
  IconUsers,
} from "@tabler/icons-react";
import { useRouter } from "next/router";
import { useNavContext } from "@/context/NavProvider";

interface ProfileBtns {
  icon: Icon;
  label: string;
  onClick: () => void;
  default: boolean;
}

function NavigationDrawer() {
  const { data: session } = useSession();
  const router = useRouter();
  const { navSidebarControls } = useNavContext();

  const btns: ProfileBtns[] = [
    {
      icon: IconGlobe,
      label: "Discover",
      onClick: () => {
        router.push("/");
        navSidebarControls.close();
      },
      default: true,
    },
    {
      icon: IconPencilPlus,
      label: "Create a Community",
      onClick: () => {
        router.push("/community/new");
        navSidebarControls.close();
      },
      default: true,
    },
    {
      icon: IconUsers,
      label: "Manage Communities",
      onClick: () => {
        router.push("/community");
        navSidebarControls.close();
      },
      default: false,
    },
    {
      icon: IconMoodPlus,
      label: "Join a Community",
      onClick: () => {
        router.push("/community/join");
        navSidebarControls.close();
      },
      default: true,
    },
    {
      icon: IconLogout,
      label: "Log Out",
      onClick: () => {
        signOut({ callbackUrl: "/auth/signin" });
        navSidebarControls.close();
      },
      default: false,
    },
  ];

  const DrawerTitle = ({
    name,
    image,
  }: {
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
              <Title order={1}>Welcome {name.split(" ")[0]}</Title>
            </>
          )}
        </Box>
      </Flex>
    );
  };

  return (
    <>
      <Stack justify="space-between" p={16}>
        {session ? (
          <DrawerTitle
            name={session!.user!.name}
            image={session!.user!.image}
          />
        ) : (
          <Title>Filmdb</Title>
        )}
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
              navSidebarControls.close();
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
    </>
  );
}

export default NavigationDrawer;
