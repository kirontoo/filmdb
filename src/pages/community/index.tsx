import Head from "next/head";
import {
  rem,
  createStyles,
  Title,
  Container,
  Grid,
  Paper,
  Text,
} from "@mantine/core";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";
import Link from "next/link";

import prisma from "@/lib/prismadb";
import { GetServerSidePropsContext } from "next";
import { Community } from "@prisma/client";
import { NothingFoundBackground } from "@/components";

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

function CommunityPage({communities}: Data) {
  const { classes } = useStyles();

  return (
    <>
      <Head>
        <title>FilmDB | search media</title>
      </Head>
      <Container size="xl">
        <Title className={classes.title} align="center">
          Your Communities
        </Title>

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


type Data = {
  communities: Community[];
};

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { req, res } = ctx;
  const session = await getServerSession(req, res, authOptions);
  if (session) {
    try {
      const user = await prisma.user.findUnique({
        where: {
          email: session!.user!.email as string,
        },
        include: {
          communities: true,
        },
      });

      const data = JSON.parse(JSON.stringify(user?.communities));

      return {
        props: {
          communities: data ?? [],
        },
      };
    } catch (error) {
      return {
        redirect: {
          destination: "/404",
        },
      };
    }
  } else {
    return {
      redirect: {
        destination: "/404",
      },
    };
  }
}

export default CommunityPage;
