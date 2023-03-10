import { useSession, signIn, signOut } from "next-auth/react";
import { createStyles, Button } from "@mantine/core";

const useStyles = createStyles((theme) => ({
  button: {
    [theme.fn.smallerThan("xs")]: {
      display: "none",
    },
  },
}));

export default function LoginBtn() {
  const { data: session } = useSession();
  const { classes } = useStyles();
  if (session) {
    return (
      <>
        <span className={classes.button}>
          Signed in as {session?.user.email}
        </span>
        <Button className={classes.button} onClick={() => signOut()}>
          Sign out
        </Button>
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
