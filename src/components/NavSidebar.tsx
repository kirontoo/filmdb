import { useSession, signOut } from "next-auth/react";
import {
  NavLink,
  Stack,
} from "@mantine/core";
import {
  Icon,
  IconGlobe,
  IconInfoCircle,
  IconLogin,
  IconLogout,
  IconMoodPlus,
  IconPencilPlus,
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
      label: "Trending",
      onClick: () => {
        router.push("/");
        navSidebarControls.close();
      },
      default: true,
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
      icon: IconPencilPlus,
      label: "Create a Community",
      onClick: () => {
        router.push("/community/new");
        navSidebarControls.close();
      },
      default: true,
    },
    {
      icon: IconInfoCircle,
      label: "About Us",
      onClick: () => {
        router.push("/about");
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

  return (
    <>
      <Stack justify="space-between" p={16}>
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
      </Stack>
    </>
  );
}

export default NavigationDrawer;
