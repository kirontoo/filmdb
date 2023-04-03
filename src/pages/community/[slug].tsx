import {
  ActionIcon,
  Avatar,
  Card,
  Container,
  CopyButton,
  Divider,
  Flex,
  Grid,
  Paper,
  Stack,
  Tabs,
  Text,
  Title,
  Tooltip,
  createStyles,
  Button,
} from "@mantine/core";
import Head from "next/head";
import format from "date-format";
import {
  MediaImageCard,
  MediaImageCardHeader,
  MediaImageCardFooter,
} from "@/components";
import { buildTMDBImageURL } from "@/lib/tmdb";
import { useEffect } from "react";
import { Media } from "@prisma/client";
import { IconCopy, IconCheck, IconEdit } from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import { useCommunityContext } from "@/context/CommunityProvider";
import { useRouter } from "next/router";
import { useMediaContext } from "@/context/MediaProvider";
import { useLoadingContext } from "@/context/LoadingProvider";
import { useSession } from "next-auth/react";

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

// function CommunityDashboard({ community }: CommunityDashboardProps) {
function CommunityDashboard() {
  const router = useRouter();
  const { setLoading } = useLoadingContext();
  const { classes } = useStyles();
  const { currentCommunity, setCurrentCommunity, isFetching } =
    useCommunityContext();
  const { setMedias, watchedMedia, queuedMedia } = useMediaContext();
  const { slug } = router.query;
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/404");
    },
  });
  const fetchCommunities = async (community: string) => {
    const query = encodeURI(`community=${community}`);
    const res = await fetch(`/api/media?${query}`);
    if (res.ok) {
      const { data } = await res.json();
      setMedias(data.medias);
    }
  };

  useEffect(() => {
    if (session && !isFetching) {
      loadData();
    }
  }, [slug, session, isFetching]);

  async function loadData() {
    setLoading(true);
    try {
      const community = Array.isArray(slug) ? slug[0] : slug;
      if (community) {
        setCurrentCommunity(community);
        await fetchCommunities(community);
      }
    } catch (e) {
      router.push("/404");
    } finally {
      setLoading(false);
    }
  }

  const openTransferListModal = (media: Media) =>
    modals.openConfirmModal({
      modalId: `${media.title}-${media.id}`,
      title: media.watched
        ? `Move ${media.title} to queue`
        : `Move ${media.title} to watched`,
      children: (
        <Text size="sm">
          Click &quot;confirm&quot; to move <strong>{media.title}</strong> to{" "}
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
      closeOnConfirm: false,
      onConfirm: async () => {
        const res = await fetch(`/api/media/${media.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            watched: !media.watched,
          }),
        });
        if (res.ok) {
          modals.close(`${media.title}-${media.id}`);
        }
      },
    });

  return (
    <>
      <Head>
        <title>FilmDB | {`${currentCommunity && currentCommunity.name}`}</title>
      </Head>
      <Container size="xl">
        <>
          {currentCommunity && (
            <>
              <Paper>
                <Flex
                  justify="space-between"
                  direction={{ base: "column", lg: "row" }}
                  gap="md"
                >
                  <Stack spacing="sm">
                    <Title>{currentCommunity.name}</Title>
                    <Text component="p">{currentCommunity.description}</Text>
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
                            {currentCommunity.members.length < 5
                              ? currentCommunity.members.map((m) => (
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
                              : currentCommunity.members
                                .slice(
                                  0,
                                  Math.min(4, currentCommunity.members.length)
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
                            {currentCommunity.members.length > 4 && (
                              <Avatar radius="xl">
                                +{currentCommunity.members.length - 4}
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
                            {currentCommunity.inviteCode}
                          </Text>
                        </Stack>
                        <CopyButton
                          value={`${origin}/currentCommunity/join?code=${currentCommunity.inviteCode}`}
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
                          title: `Update ${currentCommunity.name}`,
                          size: "md",
                          innerProps: {
                            name: currentCommunity.name ?? "",
                            description: currentCommunity.description ?? "",
                            communityId: currentCommunity.id ?? "",
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
                    {watchedMedia.map((m) => {
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
                                  {format("yyyy/MM/dd", new Date(m.createdAt))}
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
                    {queuedMedia.map((m) => {
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
                                  {format("yyyy/MM/dd", new Date(m.createdAt))}
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
      </Container>
    </>
  );
}

export default CommunityDashboard;
