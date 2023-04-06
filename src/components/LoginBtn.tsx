import { useSession, signIn, signOut } from "next-auth/react";
import {
  createStyles,
  Button,
  Container,
  Avatar,
  UnstyledButton,
  Group,
  Text,
  Menu,
  rem,
} from "@mantine/core";
import {
  IconLogout,
  IconHeart,
  IconStar,
  IconMessage,
  IconSettings,
  IconPlayerPause,
  IconTrash,
  IconSwitchHorizontal,
  IconChevronDown,
} from "@tabler/icons-react";
import { useState } from "react";

const useStyles = createStyles((theme) => ({
  user: {
    color: theme.colorScheme === "dark" ? theme.colors.dark[0] : theme.black,
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    borderRadius: theme.radius.sm,
    transition: "background-color 100ms ease",

    "&:hover": {
      backgroundColor:
        theme.colorScheme === "dark" ? theme.colors.dark[8] : theme.white,
    },

    [theme.fn.smallerThan("xs")]: {
      display: "none",
    },
  },
  userActive: {
    backgroundColor:
      theme.colorScheme === "dark" ? theme.colors.dark[8] : theme.white,
  },
  button: {
    [theme.fn.smallerThan("xs")]: {
      display: "none",
    },
  },
}));

export default function LoginBtn() {
  const { data: session } = useSession();
  const { classes, cx } = useStyles();

  const [userMenuOpened, setUserMenuOpened] = useState(false);

  if (session) {
    return (
      <>
        <Menu
          width={260}
          position="bottom-end"
          transitionProps={{ transition: "pop-top-right" }}
          onClose={() => setUserMenuOpened(false)}
          onOpen={() => setUserMenuOpened(true)}
        >
          <Menu.Target>
            <UnstyledButton
              className={cx(classes.user, {
                [classes.userActive]: userMenuOpened,
              })}
            >
              <Group spacing={7}>
                <Avatar
                  src={session.user?.image}
                  alt={session.user?.name ?? ""}
                  radius="xl"
                  size={30}
                />
                <Text weight={500} size="sm" sx={{ lineHeight: 1 }} mr={3}>
                  {session.user?.name}
                </Text>
                <IconChevronDown size={rem(12)} stroke={1.5} />
              </Group>
            </UnstyledButton>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              icon={<IconLogout size="0.9rem" stroke={1.5} />}
              onClick={() => signOut()}
            >
              Logout
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </>
    );
  }
  return (
    <>
      <Button className={classes.button} onClick={() => signIn()}>
        Sign in
      </Button>
    </>
  );
}
