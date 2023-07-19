import { useSession, signIn, signOut } from "next-auth/react";
import {
  createStyles,
  Button,
  Avatar,
  UnstyledButton,
} from "@mantine/core";
import { useNavContext } from "@/context/NavProvider";

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

  const { asideSidebarControls } = useNavContext();

  if (session) {
    return (
      <>
        <UnstyledButton onClick={asideSidebarControls.toggle}>
          <Avatar src={session!.user?.image} size="sm" />
        </UnstyledButton>
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
