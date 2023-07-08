import Head from "next/head";
import {
  rem,
  createStyles,
  Stack,
  Title,
  Container,
  Grid,
  Paper,
  Text,
  Divider,
} from "@mantine/core";
import Link from "next/link";
import { NothingFoundBackground } from "@/components";
import { useCommunityContext } from "@/context/CommunityProvider";
import { useLoadingContext } from "@/context/LoadingProvider";

const useStyles = createStyles((theme) => ({
  card: {
    transition: "transform 150ms ease, box-shadow 100ms ease",
    minHeight: rem("150px"),
    "&:hover": {
      boxShadow: theme.shadows.md,
      transform: "scale(1.02)",
    },
    color: "black",
  },
  title: {
    marginBottom: rem(16),
  },
}));

function pickRandColor() {
  const colors = [
    "blue",
    "red",
    "pink",
    "grape",
    "violet",
    "indigo",
    "cyan",
    "teal",
    "green",
    "yellow",
    "orange",
    "lime",
  ];

  return colors[Math.floor(Math.random() * colors.length)];
}

function CommunityPage() {
  const { classes } = useStyles();
  const { communities } = useCommunityContext();
  const { isLoading } = useLoadingContext();

  if (isLoading) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Communities | FilmDB</title>
      </Head>
      <Container size="xl">
        <Stack
          sx={(theme) => ({
            marginBottom: theme.spacing.md,
          })}
        >
          <Title className={classes.title} align="center">
            Your Communities
          </Title>
          <Divider />
        </Stack>

        {communities.length == 0 ? (
          <NothingFoundBackground
            title="There's nothing here!"
            description="Looks like you haven't joined any communities yet! Click the link below to create a new community or join an existing one. You've got an invite code right? :)"
            backgroundImage={false}
            btnLink="/community/new"
            btnText="Create or join a community"
          />
        ) : (
          <Grid grow={false} columns={3}>
            {communities.map((c) => {
              return (
                <Grid.Col sm={2} lg={1} key={c.slug}>
                  <Paper
                    className={classes.card}
                    withBorder
                    shadow="sm"
                    p="md"
                    component={Link}
                    href={`/community/${c.slug}`}
                    bg={`${pickRandColor()}.2`}
                  >
                    <Title order={2} size="h3">
                      {c.name}
                    </Title>
                    <Text>{c.description}</Text>
                  </Paper>
                </Grid.Col>
              );
            })}
          </Grid>
        )}
      </Container>
    </>
  );
}

CommunityPage.auth = true;

export default CommunityPage;
