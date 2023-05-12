import {
  createStyles,
  rem,
  Flex,
  Text,
  Center,
  Stack,
  UnstyledButton,
} from "@mantine/core";
import { IconHome, IconPlus, IconUser, IconUsers } from "@tabler/icons-react";
import { useDisclosure, useToggle } from "@mantine/hooks";
import { useRouter } from "next/router";
import { useEffect } from "react";
import ProfileDrawer from "./ProfileDrawer";

const useStyles = createStyles((theme) => ({
  nav: {
    position: "fixed",
    left: 0,
    bottom: 0,
    backgroundColor:
      theme.colorScheme == "dark" ? theme.black : theme.colors.gray["3"],
    width: "100%",
    zIndex: 1000,
    paddingTop: rem(8),
    paddingBottom: rem(8),
  },
  navIcon: {
    border: "1px solid",
    borderColor: theme.colorScheme === "dark" ? theme.white : theme.black,
    borderRadius: "100%",
    height: rem("30px"),
    width: rem("30px"),
  },
  active: {
    background: theme.white,
    color: theme.black,
  },
}));

function MobileNav() {
  const { classes, cx } = useStyles();
  const Groups = "groups";
  const Home = "home";
  const Add = "add";
  const Profile = "profile";
  const [currentNav, toggle] = useToggle([
    Home,
    Groups,
    Add,
    Profile,
    "none",
  ] as const);
  const router = useRouter();

  const [opened, { open, close }] = useDisclosure(false);

  useEffect(() => {
    switch (router.route) {
      case "/communities":
        toggle(Groups);
        break;
      case "/media/search":
        toggle(Add);
        break;
      case "/":
        toggle(Home);
      default:
        toggle("none");
        break;
    }
  }, []);

  return (
    <>
      <header className={classes.nav}>
        <Flex justify="space-around">
          <UnstyledButton
            onClick={() => {
              toggle(Home);
              router.push("/");
            }}
          >
            <Stack spacing="0.2rem" align="center">
              <Center
                className={cx(classes.navIcon, {
                  [classes.active]: currentNav === Home,
                })}
              >
                <IconHome size={rem(16)} />
              </Center>
              <Text tt="uppercase">home</Text>
            </Stack>
          </UnstyledButton>
          <UnstyledButton
            onClick={() => {
              toggle(Groups);
              router.push("/community");
            }}
          >
            <Stack spacing="0.2rem" align="center">
              <Center
                className={cx(classes.navIcon, {
                  [classes.active]: currentNav === Groups,
                })}
              >
                <IconUsers size={rem(16)} />
              </Center>
              <Text fz="sm" tt="uppercase">
                groups
              </Text>
            </Stack>
          </UnstyledButton>
          <UnstyledButton
            onClick={() => {
              toggle(Add);
              router.push("/media/search");
            }}
          >
            <Stack spacing="0.2rem" align="center">
              <Center
                className={cx(classes.navIcon, {
                  [classes.active]: currentNav === Add,
                })}
              >
                <IconPlus size={rem(16)} />
              </Center>
              <Text fz="sm" tt="uppercase">
                Add
              </Text>
            </Stack>
          </UnstyledButton>
          <UnstyledButton
            onClick={() => {
              if (!opened) {
                toggle(Profile);
                open();
              } else {
                close();
                toggle("none");
              }
            }}
          >
            <Stack spacing="0.2rem" align="center">
              <Center
                className={cx(classes.navIcon, {
                  [classes.active]: currentNav === Profile,
                })}
              >
                <IconUser size={rem(16)} />
              </Center>
              <Text fz="sm" tt="uppercase">
                Profile
              </Text>
            </Stack>
          </UnstyledButton>
        </Flex>
      </header>
      <ProfileDrawer
        opened={opened}
        onClose={() => {
          toggle("none");
          close();
        }}
        zIndex={300}
      />
    </>
  );
}

export default MobileNav;
