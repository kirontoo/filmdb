import {
  createStyles,
  Stack,
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
import { useState, useEffect } from "react";
import { useCommunityContext } from "@/context/CommunityProvider";

const useStyles = createStyles((theme) => ({
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
  const [isLoading, setLoading] = useState<boolean>(false);
  const { addCommunity } = useCommunityContext();

  useEffect(() => {
    if (code !== undefined) {
      form.setValues({ inviteCode: code as string });
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

  const joinCommunity = async (values: { inviteCode: string }) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/community/join?code=${values.inviteCode}`, {
        method: "POST",
      });

      const { message, data } = await res.json();

      if (res.ok) {
        addCommunity(data.community);
        router.push(`/community/${data.community.slug}`);
      } else {
        if (res.status === 401) {
          // unauthorized: user must log in
          form.setErrors({ inviteCode: "You must be logged in!" });
        }

        if (message) {
          form.setErrors({ inviteCode: message });
        }
      }
    } catch (e) {
      form.setErrors({ inviteCode: "server error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={460} py="md">
      <Stack justify="center" spacing="sm">
        <div>
          <Title order={1} align="center">
            Join a community
          </Title>
          <Text c="dimmed" fz="sm" ta="center">
            Enter your invite code
          </Text>
        </div>
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
            autoFocus
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
            <Button
              type="submit"
              className={classes.control}
              loading={isLoading}
            >
              Join Community
            </Button>
          </Group>
        </Paper>
      </Stack>
    </Container>
  );
}

export default JoinCommunity;
