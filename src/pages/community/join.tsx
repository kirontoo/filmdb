import {
  createStyles,
  Paper,
  Title,
  Text,
  TextInput,
  Button,
  Container,
  Group,
  Anchor,
  Center,
  Box,
  rem,
} from "@mantine/core";

import { useRouter } from "next/router";
import { useForm, hasLength } from "@mantine/form";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { useEffect } from "react";

const useStyles = createStyles((theme) => ({
  title: {
    fontSize: rem(26),
    fontWeight: 900,
    fontFamily: `Greycliff CF, ${theme.fontFamily}`,
  },

  controls: {
    [theme.fn.smallerThan("xs")]: {
      flexDirection: "column-reverse",
    },
  },

  control: {
    [theme.fn.smallerThan("xs")]: {
      width: "100%",
      textAlign: "center",
    },
  },

  formContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    justifySelf: "center",
    alignSelf: "center",
  },
}));

function JoinCommunity() {
  const { classes } = useStyles();
  const router = useRouter();
  const { code } = router.query;

  useEffect(() => {
    if (code !== undefined) {
      form.setValues({ inviteCode: code as string});
    }
  }, [router.query.code]);

  const form = useForm({
    initialValues: {
      inviteCode: "",
    },

    validate: {
      inviteCode: hasLength({ min: 5, max: 8 }, "Invalid invite code"),
    },
  });

  const joinCommunity = () => {
    console.log("submitted");
  };

  return (
    <Container size={460}>
      <Title className={classes.title} align="center">
        Join a community
      </Title>
      <Text c="dimmed" fz="sm" ta="center">
        Enter your invite code
      </Text>
      <Paper
        withBorder
        shadow="md"
        p={30}
        radius="md"
        mt="xl"
        component="form"
        onSubmit={form.onSubmit(joinCommunity)}
      >
        <TextInput
          label="Invite code"
          placeholder="invite code"
          required
          {...form.getInputProps("inviteCode")}
        />
        <Group position="apart" mt="lg" className={classes.controls}>
          <Anchor
            color="dimmed"
            size="sm"
            className={classes.control}
            href="/community/new"
            component={Link}
          >
            <Center inline>
              <IconArrowLeft size={rem(12)} stroke={1.5} />
              <Box ml={5}>Create a new community</Box>
            </Center>
          </Anchor>
          <Button type="submit" className={classes.control}>
            Join Community
          </Button>
        </Group>
      </Paper>
    </Container>
  );
}

export default JoinCommunity;
