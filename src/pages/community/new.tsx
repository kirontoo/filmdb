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

  const form = useForm({
    initialValues: {
      name: "",
    },

    validate: {
      name: hasLength({ min: 5, max: 8 }, "Invalid invite code"),
    },
  });

  const createCommunity = (values: { name: string }) => {
    console.log("submitted", values);
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
        <TextInput
          label="Name"
          required
          {...form.getInputProps("name")}
        />
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
          <Button type="submit" className={classes.control}>
            Create Community
          </Button>
        </Group>
      </Paper>
    </Container>
  );
}

export default NewCommunity;
