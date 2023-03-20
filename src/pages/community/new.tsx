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

import { useForm, hasLength } from "@mantine/form";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

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

function NewCommunity() {
  const { classes } = useStyles();
  const router = useRouter();
  const [isLoading, setLoading] = useState<boolean>(false);

  const form = useForm({
    initialValues: {
      name: "",
    },

    validate: {
      name: hasLength({ min: 4, max: 15 }, "Must be between 4-15 characters"),
    },
  });

  const createCommunity = async (values: { name: string }) => {
    setLoading(true);
    const res = await fetch("/api/community", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: values.name }),
    });
    const {message, data} = await res.json();

    if (res.ok) {
      router.push(`/community/${data.community.slug}`);
    } else {
      if (res.status === 401) {
        // unauthorized: user must log in
        form.setErrors({ name: "You must be logged in!" });
      }

      if (message) {
        form.setErrors({ name: message});
      }
    }

    setLoading(false);
  };

  return (
    <Container size={460}>
      <Title className={classes.title} align="center">
        Starting a new community?
      </Title>
      <Text c="dimmed" fz="sm" ta="center">
        Just enter a name
      </Text>
      <Paper
        withBorder
        shadow="md"
        p={30}
        radius="md"
        mt="xl"
        component="form"
        onSubmit={form.onSubmit(createCommunity)}
      >
        <TextInput label="Name" required {...form.getInputProps("name")} />
        <Group position="apart" mt="lg" className={classes.controls}>
          <Anchor
            color="dimmed"
            size="sm"
            className={classes.control}
            href="/community/join"
            component={Link}
          >
            <Center inline>
              <IconArrowLeft size={rem(12)} stroke={1.5} />
              <Box ml={5}>Got an invite code?</Box>
            </Center>
          </Anchor>
          <Button type="submit" className={classes.control} loading={isLoading}>
            Create Community
          </Button>
        </Group>
      </Paper>
    </Container>
  );
}

export default NewCommunity;
