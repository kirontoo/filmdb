import {
  Box,
  Group,
  Collapse,
  Autocomplete,
  useMantineTheme,
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
import { useMemo, useEffect, useState } from "react";
import { Media } from "@prisma/client";
import {
  IconSearch,
  IconCopy,
  IconCheck,
  IconEdit,
  IconX,
  IconAdjustmentsFilled,
} from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import { useCommunityContext } from "@/context/CommunityProvider";
import { useRouter } from "next/router";
import { useMediaContext } from "@/context/MediaProvider";
import { useLoadingContext } from "@/context/LoadingProvider";
import { useSession } from "next-auth/react";
import { useDisclosure } from "@mantine/hooks";

const useStyles = createStyles((theme) => ({
  filterContainer: {},

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

  searchbar: {
    width: "100%",
  },
}));

function CommunityDashboard() {
  const theme = useMantineTheme();
  const router = useRouter();
  const { setLoading } = useLoadingContext();
  const { classes } = useStyles();
  const { currentCommunity, setCurrentCommunity, isFetching } =
    useCommunityContext();
  const { setMedias, medias } = useMediaContext();
  const { slug } = router.query;
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [openFilterOptions, { toggle: toggleFilterOptions }] =
    useDisclosure(false);

  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/404");
    },
  });

  const searchedMedias = useMemo<Media[]>(() => {
    return medias.filter((m: Media) => {
      return m.title.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [searchQuery, medias]);

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

  const openCommunityFormModal = () => {
    modals.openContextModal({
      modal: "communityForm",
      title: `Update ${currentCommunity!.name}`,
      size: "xl",
      innerProps: {
        name: currentCommunity!.name ?? "",
        description: currentCommunity!.description ?? "",
        communityId: currentCommunity!.id ?? "",
      },
    });
  };

  const openMediaModal = (media: Media) => {
    modals.openContextModal({
      modal: "media",
      title: `${media.title}`,
      size: "xl",
      innerProps: { media },
    });
  };

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
                          value={`${origin}/community/join?code=${currentCommunity.inviteCode}`}
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
                      onClick={openCommunityFormModal}
                    >
                      Update
                    </Button>
                  </Stack>
                </Flex>
              </Paper>

              <Divider my="md" />

              <Box mx="auto">
                <Flex gap="sm">
                  <Autocomplete
                    className={classes.searchbar}
                    placeholder="Search Media"
                    data={medias.map((m) => m.title)}
                    onChange={setSearchQuery}
                    value={searchQuery}
                    icon={<IconSearch size="1.1rem" stroke={1.5} />}
                    rightSection={
                      <Tooltip label="clear search">
                        <ActionIcon
                          size={32}
                          color={theme.primaryColor}
                          onClick={() => setSearchQuery("")}
                        >
                          <IconX size="1.1rem" stroke={1.5} />
                        </ActionIcon>
                      </Tooltip>
                    }
                    rightSectionWidth={42}
                  />
                  <Button
                    onClick={toggleFilterOptions}
                    rightIcon={<IconAdjustmentsFilled size="1.1rem" />}
                  >
                    Filters
                  </Button>
                </Flex>

                <Collapse
                  in={openFilterOptions}
                  className={classes.filterContainer}
                >
                  <Text>aorisentaoirenstoiaresnt</Text>
                </Collapse>
              </Box>

              <Grid grow={false} columns={5} className={classes.grid}>
                {searchedMedias.map((m) => {
                  return (
                    <Grid.Col sm={2} lg={1} key={m.id}>
                      <MediaImageCard
                        component="button"
                        key={m.id}
                        image={buildTMDBImageURL(m.posterPath)}
                        className={classes.mediaCard}
                        onClick={() => openMediaModal(m)}
                      >
                        <MediaImageCardHeader className={classes.cardHeader}>
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
            </>
          )}
        </>
      </Container>
    </>
  );
}

export default CommunityDashboard;
