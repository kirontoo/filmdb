import { useRouter } from "next/router";
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

const useStyles = createStyles((theme) => ({
  card: {
    transition: "transform 150ms ease, box-shadow 100ms ease",
    minHeight: rem("150px"),
    "&:hover": {
      boxShadow: theme.shadows.md,
      transform: "scale(1.02)",
    },
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

function Community({ communities }: Data) {
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
                  bg={`${pickRandColor()}.4`}
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
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: session!.user!.email as string,
      },
      include: {
        communities: true,
      },
    });

    return {
      props: {
        communities: user?.communities || [],
      },
    };
  } catch (error) {
    return {
      redirect: {
        destination: "/404",
      },
    };
  }
}

export default Community;
