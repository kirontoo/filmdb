import {
  createStyles,
  rem,
  Flex,
  Text,
  Center,
  Avatar,
  Header,
  Container,
  Button,
  ActionIcon,
  Group,
  Stack,
  UnstyledButton,
} from "@mantine/core";
import Link from "next/link";
import {
  IconHome,
  IconPlus,
  IconSquareRoundedPlus,
  IconUser,
  IconUsers,
} from "@tabler/icons-react";
import { useToggle } from "@mantine/hooks";
import { useRouter } from "next/router";
import { useEffect } from "react";

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
    height: rem("40px"),
    width: rem("40px"),
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

  useEffect(() => {
    switch (router.route) {
      case "/communities":
        toggle(Groups);
        break;
      case "/search":
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
              <IconHome size={rem(24)} />
            </Center>
            <Text tt="uppercase">home</Text>
          </Stack>
        </UnstyledButton>
        <UnstyledButton
          onClick={() => {
            toggle(Groups);
          }}
        >
          <Stack spacing="0.2rem" align="center">
            <Center
              className={cx(classes.navIcon, {
                [classes.active]: currentNav === Groups,
              })}
            >
              <IconUsers size={rem(24)} />
            </Center>
            <Text tt="uppercase">groups</Text>
          </Stack>
        </UnstyledButton>
        <UnstyledButton onClick={() => toggle(Add)}>
          <Stack spacing="0.2rem" align="center">
            <Center
              className={cx(classes.navIcon, {
                [classes.active]: currentNav === Add,
              })}
            >
              <IconPlus size={rem(24)} />
            </Center>
            <Text tt="uppercase">Add</Text>
          </Stack>
        </UnstyledButton>
        <UnstyledButton onClick={() => toggle(Profile)}>
          <Stack spacing="0.2rem" align="center">
            <Center
              className={cx(classes.navIcon, {
                [classes.active]: currentNav === Profile,
              })}
            >
              <IconUser size={rem(24)} />
            </Center>
            <Text tt="uppercase">Profile</Text>
          </Stack>
        </UnstyledButton>
      </Flex>
    </header>
  );
}

export default MobileNav;
