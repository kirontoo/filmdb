import {
  ActionIcon,
  Avatar,
  Card,
  Container,
  CopyButton,
  Divider,
  Flex,
  Grid,
  LoadingOverlay,
  Paper,
  Stack,
  Tabs,
  Text,
  Title,
  Tooltip,
  createStyles,
  Button,
} from "@mantine/core";
import { GetServerSidePropsContext } from "next";
import Head from "next/head";
import format from "date-format";
import {
  MediaImageCard,
  MediaImageCardHeader,
  MediaImageCardFooter,
} from "@/components";
import { buildTMDBImageURL } from "@/lib/tmdb";
import { useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { Community, Media } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]";
import prisma from "@/lib/prismadb";
import { IconCopy, IconCheck, IconEdit } from "@tabler/icons-react";
import { modals } from "@mantine/modals";

type CommunityWithMedia = {
  medias: Media[];
  members: { name: string; image: string }[];
} & Community;

interface CommunityDashboardProps {
  community: CommunityWithMedia | null;
}

const useStyles = createStyles((theme) => ({
  cardHeader: {
    color: theme.white,
  },
  date: {
    color: theme.white,
    opacity: 0.7,
    fontWeight: 700,
    textTransform: "uppercase",
  },

  mediaCard: {
    margin: "auto",
    [`@media (min-width:${theme.breakpoints.md})`]: {
      margin: 0,
    },
    cursor: "pointer",
  },

  grid: {
    paddingTop: theme.spacing.lg,
  },
}));

function CommunityDashboard({ community }: CommunityDashboardProps) {
  const [visible, handlers] = useDisclosure(false);
  const [isLoading, setLoading] = useState(false);
  const { classes } = useStyles();

  const openTransferListModal = (media: Media) =>
    modals.openConfirmModal({
      title: media.watched
        ? `Move ${media.title} to queue`
        : `Move ${media.title} to watched`,
      children: (
        <Text size="sm">
          Click "confirm" to move <strong>{media.title}</strong> to{" "}
          {media.watched ? "queue" : "watched"} list
        </Text>
      ),
      centered: true,
      labels: { confirm: "Confirm", cancel: "Cancel" },
      confirmProps: {
        uppercase: true,
      },
      cancelProps: {
        uppercase: true,
        variant: "subtle",
        color: "dark",
      },
      onCancel: () => console.log("Cancel"),
      onConfirm: () => console.log("Confirmed"),
    });

  return (
    <>
      <Head>
        <title>FilmDB | {`${community && community.name}`}</title>
      </Head>
      <Container size="xl">
        {isLoading ? (
          <LoadingOverlay visible={visible} overlayBlur={2} />
        ) : (
          <>
            {community && (
              <>
                <Paper>
                  <Flex
                    justify="space-between"
                    direction={{ base: "column", lg: "row" }}
                    gap="md"
                  >
                    <Stack spacing="sm">
                      <Title>{community.name}</Title>
                      <Text component="p">{community.description}</Text>
                      <Stack spacing={0}>
                        <Text
                          fz="xs"
                          tt="uppercase"
                          fw={700}
                          c="dimmed"
                          component="span"
                        >
                          members
                        </Text>
                        <Tooltip.Group openDelay={300} closeDelay={100}>
                          <Avatar.Group spacing="sm">
                            <>
                              {community.members.length < 5
                                ? community.members.map((m) => (
                                    <Tooltip
                                      label={m.name}
                                      withArrow
                                      key={m.name}
                                    >
                                      <Avatar
                                        src={m.image ?? "image.png"}
                                        radius="xl"
                                      />
                                    </Tooltip>
                                  ))
                                : community.members
                                    .slice(
                                      0,
                                      Math.min(4, community.members.length)
                                    )
                                    .map((m) => {
                                      <Tooltip
                                        label={m.name}
                                        withArrow
                                        key={m.name}
                                      >
                                        <Avatar
                                          src={m.image ?? "image.png"}
                                          radius="xl"
                                        />
                                      </Tooltip>;
                                    })}
                              {community.members.length > 4 && (
                                <Avatar radius="xl">
                                  +{community.members.length - 4}
                                </Avatar>
                              )}
                            </>
                          </Avatar.Group>
                        </Tooltip.Group>
                      </Stack>
                    </Stack>

                    <Stack spacing="sm">
                      <Card
                        withBorder
                        radius="md"
                        sx={(theme) => ({
                          backgroundColor:
                            theme.colorScheme === "dark"
                              ? theme.colors.dark[7]
                              : theme.white,
                        })}
                      >
                        <Flex justify="space-between" align="center" gap="md">
                          <Stack spacing={0}>
                            <Text
                              fz="xs"
                              tt="uppercase"
                              fw={700}
                              c="dimmed"
                              component="span"
                            >
                              Invite Code
                            </Text>
                            <Text fz="xl" fw={500} component="span">
                              {community.inviteCode}
                            </Text>
                          </Stack>
                          <CopyButton
                            value={`${origin}/community/join?code=${community.inviteCode}`}
                            timeout={2000}
                          >
                            {({ copied, copy }) => (
                              <Tooltip
                                label={copied ? "Copied" : "Copy"}
                                withArrow
                                withinPortal
                              >
                                <ActionIcon
                                  color={copied ? "green" : "blue"}
                                  onClick={copy}
                                  size="lg"
                                  variant="subtle"
                                >
                                  {copied ? (
                                    <IconCheck size="1.5rem" />
                                  ) : (
                                    <IconCopy size="1.5rem" />
                                  )}
                                </ActionIcon>
                              </Tooltip>
                            )}
                          </CopyButton>
                        </Flex>
                      </Card>
                      <Button
                        leftIcon={<IconEdit size="1rem" />}
                        variant="light"
                        onClick={() => {
                          modals.openContextModal({
                            modal: "communityForm",
                            title: `Update ${community.name}`,
                            size: "md",
                            innerProps: {
                              name: community.name,
                              description: community.description ?? "",
                              communityId: community.id,
                            },
                          });
                        }}
                      >
                        Update
                      </Button>
                    </Stack>
                  </Flex>
                </Paper>

                <Divider my="md" />

                <Tabs defaultValue="watched" keepMounted={false}>
                  <Tabs.List>
                    <Tabs.Tab value="watched">Watched</Tabs.Tab>
                    <Tabs.Tab value="queue">Queue</Tabs.Tab>
                  </Tabs.List>

                  <Tabs.Panel value="watched">
                    <Grid
                      grow={false}
                      columns={4}
                      gutter="sm"
                      className={classes.grid}
                    >
                      {community.medias
                        .filter((m) => m.watched)
                        .map((m) => {
                          return (
                            <Grid.Col sm={2} lg={1} key={m.id}>
                              <MediaImageCard
                                component="button"
                                key={m.id}
                                image={buildTMDBImageURL(m.posterPath)}
                                className={classes.mediaCard}
                                onClick={() => openTransferListModal(m)}
                              >
                                <MediaImageCardHeader
                                  className={classes.cardHeader}
                                >
                                  <>
                                    <Text
                                      align="left"
                                      className={classes.date}
                                      size="xs"
                                    >
                                      {format(
                                        "yyyy/MM/dd",
                                        new Date(m.createdAt)
                                      )}
                                    </Text>
                                    <Title order={3} align="left">
                                      {m.title}
                                    </Title>
                                  </>
                                </MediaImageCardHeader>
                                <MediaImageCardFooter>hi</MediaImageCardFooter>
                              </MediaImageCard>
                            </Grid.Col>
                          );
                        })}
                    </Grid>
                  </Tabs.Panel>

                  <Tabs.Panel value="queue">
                    <Grid grow={false} columns={4} gutter="sm">
                      {community.medias
                        .filter((m) => !m.watched)
                        .map((m) => {
                          return (
                            <Grid.Col
                              sm={2}
                              lg={1}
                              key={m.id}
                              className={classes.grid}
                            >
                              <MediaImageCard
                                component="button"
                                key={m.id}
                                image={buildTMDBImageURL(m.posterPath)}
                                className={classes.mediaCard}
                                onClick={() => openTransferListModal(m)}
                              >
                                <MediaImageCardHeader
                                  className={classes.cardHeader}
                                >
                                  <>
                                    <Text
                                      align="left"
                                      className={classes.date}
                                      size="xs"
                                    >
                                      {format(
                                        "yyyy/MM/dd",
                                        new Date(m.createdAt)
                                      )}
                                    </Text>
                                    <Title order={3} align="left">
                                      {m.title}
                                    </Title>
                                  </>
                                </MediaImageCardHeader>
                                <MediaImageCardFooter>hi</MediaImageCardFooter>
                              </MediaImageCard>
                            </Grid.Col>
                          );
                        })}
                    </Grid>
                  </Tabs.Panel>
                </Tabs>
              </>
            )}
          </>
        )}
      </Container>
    </>
  );
}

export default CommunityDashboard;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  // should only be able to grab community data if you are a member of that community
  const { req, res, query } = ctx;
  const { slug } = query;

  const name = Array.isArray(slug) ? slug[0] : slug;

  const session = await getServerSession(req, res, authOptions);
  if (session && name) {
    try {
      const community = await prisma.community.findFirst({
        where: {
          slug: name,
          members: {
            some: {
              email: session!.user!.email as string,
            },
          },
        },
        include: {
          medias: true,
          members: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      });

      const isAMember = await prisma.user.findFirst({
        where: {
          email: session!.user!.email as string,
          communities: {
            some: {
              slug: name,
            },
          },
        },
        select: {
          communities: {
            include: {
              members: {
                select: {
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      if (!isAMember) {
        return {
          redirect: {
            destination: "/404",
          },
        };
      }
      return { props: { community: JSON.parse(JSON.stringify(community)) } };
    } catch (error) {
      // TODO: set up proper errors
      console.log(error);
      return {
        props: {},
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
