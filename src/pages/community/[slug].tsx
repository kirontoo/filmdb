import {
  rem,
  Box,
  Group,
  Radio,
  Select,
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
  IconSortAscending,
  IconSortDescending,
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
import { useDisclosure, useToggle } from "@mantine/hooks";

const useStyles = createStyles((theme) => ({
  filterContainer: {
    paddingTop: theme.spacing.md,
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.md,
  },

  checkboxFilterContainer: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing.xs,
  },

  sortSelector: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing.md,
  },

  cardHeader: {
    color: theme.white,
  },

  resetBtn: {
    width: "100%",
    [`@media (min-width:${theme.breakpoints.lg})`]: {
      width: "max-content",
    },
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

  searchbar: {
    flexGrow: 1,
  },
}));

const SortItems = [
  {
    value: "alphabetical",
    label: "Alphabetical",
  },
  {
    value: "dateAdded",
    label: "Date Added",
  },
  {
    value: "dateWatched",
    label: "Date Watched",
  },
];

function CommunityDashboard() {
  const theme = useMantineTheme();
  const router = useRouter();
  const { classes } = useStyles();
  const { setLoading } = useLoadingContext();
  const { currentCommunity, setCurrentCommunity, isFetching } =
    useCommunityContext();
  const { setMedias, medias } = useMediaContext();
  const { slug } = router.query;
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/404");
    },
  });

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [openFilterOptions, { toggle: toggleFilterOptions }] =
    useDisclosure(false);
  const [listFilter, setListFilter] = useState<string>("all");
  const [mediaTypeFilter, setMediaTypeFilter] = useState<string>("all");
  const [sortSelect, setSortSelect] = useState<string | null>(
    SortItems[0].value
  );
  const [sortDirection, toggleDirection] = useToggle(["asc", "dec"]);

  const searchedMedias = useMemo<Media[]>(() => {
    let results = medias;

    if (listFilter !== "all") {
      const watched = listFilter === "watched" ? true : false;
      results = results.filter((m) => m.watched == watched);
    }

    if (mediaTypeFilter !== "all") {
      results = results.filter((m) => m.mediaType == mediaTypeFilter);
    }

    if (searchQuery !== "") {
      results = results.filter((m: Media) => {
        return m.title.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    // sort data
    const asc = sortDirection == "asc";
    if (sortSelect === SortItems[0].value) {
      // alphabetically
      results = results.sort((a, b) => {
        return asc
          ? ("" + a.title).localeCompare(b.title)
          : ("" + b.title).localeCompare(a.title);
      });
    } else if (sortSelect === SortItems[1].value) {
      // date added
      results = results.sort((a, b) => {
        return asc
          ? a.createdAt.getTime() - b.createdAt.getTime()
          : b.createdAt.getTime() - a.createdAt.getTime();
      });
    } else if (sortSelect === SortItems[2].value) {
      // date watched
      results = results.sort((a, b) => {
        if (a.dateWatched && b.dateWatched) {
          return asc
            ? a.dateWatched.getTime() - b.dateWatched.getTime()
            : b.dateWatched.getTime() - a.dateWatched.getTime();
        }
        return a.dateWatched && !b.dateWatched ? -1 : 1;
      });
    }

    return results;
  }, [searchQuery, medias, mediaTypeFilter, listFilter, sortSelect, sortDirection]);

  useEffect(() => {
    if (session && !isFetching) {
      resetFilters();
      setSortSelect(SortItems[0].value);
      loadData();
    }
  }, [slug, session, isFetching]);

  const resetFilters = () => {
    setListFilter("all");
    setMediaTypeFilter("all");
  };

  async function loadData() {
    setLoading(true);
    try {
      const community = Array.isArray(slug) ? slug[0] : slug;
      if (community) {
        setCurrentCommunity(community);
        const query = encodeURI(`community=${community}`);
        const res = await fetch(`/api/media?${query}`);
        if (res.ok) {
          const { data } = await res.json();
          setMedias(data.medias);
        }
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
                <Flex
                  gap="md"
                  direction={{ base: "column", lg: "row" }}
                  justify="space-between"
                >
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

                  <Flex gap="md">
                    <Select
                      label={<Text>Sort by:</Text>}
                      data={SortItems}
                      placeholder="Sort by..."
                      className={classes.sortSelector}
                      value={sortSelect}
                      onChange={setSortSelect}
                    />
                    <ActionIcon
                      size="lg"
                      variant="light"
                      onClick={() => toggleDirection()}
                    >
                      {sortDirection == "asc" ? (
                        <IconSortAscending />
                      ) : (
                        <IconSortDescending />
                      )}
                    </ActionIcon>
                  </Flex>

                  <Button
                    onClick={toggleFilterOptions}
                    variant="light"
                    rightIcon={<IconAdjustmentsFilled size="1.1rem" />}
                  >
                    Filters
                  </Button>
                </Flex>

                <Collapse
                  in={openFilterOptions}
                  className={classes.filterContainer}
                >
                  <Stack>
                    <Grid columns={4}>
                      <Grid.Col sm={2} lg={1}>
                        <Radio.Group
                          label={
                            <Box>
                              <Text>List</Text>
                              <Divider />
                            </Box>
                          }
                          labelProps={{ size: "md", fw: 600 }}
                          className={classes.checkboxFilterContainer}
                          value={listFilter}
                          onChange={setListFilter}
                        >
                          <Radio label="All" value="all" />
                          <Radio label="Watched" value="watched" />
                          <Radio label="Queued" value="queued" />
                        </Radio.Group>
                      </Grid.Col>
                      <Grid.Col sm={2} lg={1}>
                        <Radio.Group
                          label={
                            <Box>
                              <Text>Media Type</Text>
                              <Divider />
                            </Box>
                          }
                          labelProps={{ size: "md", fw: 600 }}
                          className={classes.checkboxFilterContainer}
                          value={mediaTypeFilter}
                          onChange={setMediaTypeFilter}
                        >
                          <Radio label="All" value="all" />
                          <Radio label="Movie" value="movie" />
                          <Radio label="TV show" value="tv" />
                        </Radio.Group>
                      </Grid.Col>
                    </Grid>
                    <Flex justify="right">
                      <Button
                        variant="light"
                        onClick={resetFilters}
                        className={classes.resetBtn}
                      >
                        Reset Filters
                      </Button>
                    </Flex>
                  </Stack>
                </Collapse>
              </Box>

              <Divider my="md" labelPosition="center" />
              <Grid grow={false} columns={5}>
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
