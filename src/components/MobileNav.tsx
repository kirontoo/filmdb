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

const useStyles = createStyles((theme) => ({
  nav: {
    position: "fixed",
    left: 0,
    bottom: 0,
    backgroundColor:
      theme.colorScheme == "dark" ? theme.black : theme.colors.gray["3"],
    width: "100%",
    zIndex: 5,
    paddingTop: rem(16),
    paddingBottom: rem(16),
  },
  navBtn: {
    borderRadius: "100%",
  },
  navIcon: {
    border: "1px solid",
    borderColor: theme.colorScheme == "dark" ? theme.white : theme.black,
    borderRadius: "100%",
    height: rem("44px"),
    width: rem("44px")
  },
}));

function MobileNav() {
  const { classes } = useStyles();
  return (
    <header className={classes.nav}>
      <Flex justify="space-around">
        <Link className={classes.navBtn} href="/">
          <Stack spacing="sm">
            <Center className={classes.navIcon}>
              <IconHome />
            </Center>
            <Text tt="uppercase">home</Text>
          </Stack>
        </Link>
        <UnstyledButton className={classes.navBtn}>
          <Stack spacing="sm">
            <Center className={classes.navIcon}>
              <IconUsers />
            </Center>
            <Text tt="uppercase">groups</Text>
          </Stack>
        </UnstyledButton>
        <UnstyledButton className={classes.navBtn}>
          <Stack spacing="sm">
            <Center className={classes.navIcon}>
              <IconPlus />
            </Center>
            <Text tt="uppercase">Add</Text>
          </Stack>
        </UnstyledButton>
        <UnstyledButton className={classes.navBtn}>
          <Stack spacing="sm">
            <Center className={classes.navIcon}>
              <IconUser />
            </Center>
            <Text tt="uppercase">Profile</Text>
          </Stack>
        </UnstyledButton>
      </Flex>
    </header>
  );
}

export default MobileNav;
