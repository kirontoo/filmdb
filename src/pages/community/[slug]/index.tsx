import {
  Image,
  Group,
  ActionIcon,
  Container,
  CopyButton,
  Stack,
  Text,
  Title,
  Tooltip,
  createStyles,
  Button,
  UnstyledButton,
  LoadingOverlay,
  Card,
  Center,
  Flex,
} from "@mantine/core";
import Head from "next/head";
import { AvatarMemberList } from "@/components";
import { TMDB_IMAGE_API_BASE_URL } from "@/lib/tmdb";
import { useEffect, useState } from "react";
import { Media } from "@prisma/client";

import { Carousel } from "@mantine/carousel";
import { modals } from "@mantine/modals";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

import useIsDesktopDevice from "@/lib/hooks/useIsDesktopDevice";
import {
  IconCheck,
  IconCopy,
  IconEdit,
  IconUserPlus,
} from "@tabler/icons-react";
import useAsyncFn from "@/lib/hooks/useAsyncFn";
import { fetchCommunityWithMedia } from "@/services/medias";
import { useLoadingContext } from "@/context/LoadingProvider";
import { getQueryValue } from "@/lib/util";
import Link from "next/link";

const useStyles = createStyles((theme) => ({
  container: {
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  inviteCodeBox: {
    border: `1px solid ${theme.colors.gray[7]}`,
    borderRadius: theme.radius.md,
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`
  },
  mediaCard: {
    [`@media (min-width:${theme.breakpoints.md})`]: {
      width: "27%",
    },
  },
}));

function CommunityDashboard() {
  const router = useRouter();
  const { classes } = useStyles();
  const { isLoading } = useLoadingContext();
  const { slug } = router.query;
  const { data: session } = useSession();
  const isDesktop = useIsDesktopDevice();
  const [upcomingMedia, setUpcomingMedia] = useState<Media | null>(null);
  const cSlug = getQueryValue(slug);

  useEffect(() => {
    if (session && !isLoading) {
      onLoadData();
    }
  }, [slug, session, isLoading]);

  const fetchCommunityWithMediaFn = useAsyncFn(fetchCommunityWithMedia);

  const onLoadData = async () => {
    if (fetchCommunityWithMediaFn.loading) {
      return;
    }

    try {
      const cSlug = getQueryValue(slug);
      const community = await fetchCommunityWithMediaFn.execute({
        slug: cSlug,
      });
      const upcoming =
        community.medias.find((m: Media) => m.queue ?? 0 > 0) ?? null;
      setUpcomingMedia(upcoming);
    } catch (error) {}
  };

  const navigateToMediaPage = (media: Media) => {
    const cSlug = getQueryValue(slug);
    router.push(
      `/community/${cSlug}/media/${media.mediaType}/${media.tmdbId}/${media.id}`
    );
  };

  const openInviteModal = () => {
    modals.open({
      title: `Invite friends to ${fetchCommunityWithMediaFn?.value?.name}`,
      children: (
        <>
          <Stack spacing="sm">
            <Text component="span">Share this link to invite your friends:</Text>
            <Flex align="center" gap="sm" className={classes.inviteCodeBox} justify="space-between">
              <Text fz="lg">{origin}/community/join?code={fetchCommunityWithMediaFn.value!.inviteCode}</Text>
              <CopyButton
                value={`${origin}/community/join?code=${
                  fetchCommunityWithMediaFn.value!.inviteCode
                }`}
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
          </Stack>
        </>
      ),
    });
  };

  const mediaCarousel = (watched: boolean = false) => {
    return (
      <Carousel
        align="start"
        controlsOffset="xs"
        loop
        withControls
        breakpoints={[
          {
            minWidth: "md",
            slideSize: "28%",
            slideGap: "md",
          },
          {
            maxWidth: "md",
            slideSize: "30.333%",
            slideGap: "xs",
          },
        ]}
      >
        {fetchCommunityWithMediaFn.value &&
          fetchCommunityWithMediaFn.value.medias
            .filter((m) => m.watched === watched)
            .map((m) => (
              <Carousel.Slide key={m.id}>
                <Link
                  href={`/community/${cSlug}/media/${m.mediaType}/${m.tmdbId}/${m.id}`}
                >
                  <Image
                    radius="sm"
                    src={`${TMDB_IMAGE_API_BASE_URL}/w${
                      isDesktop ? "342" : "185"
                    }/${m.posterPath}`}
                    alt={m.title}
                  />
                </Link>
              </Carousel.Slide>
            ))}
      </Carousel>
    );
  };

  if (fetchCommunityWithMediaFn.loading || isLoading) {
    return (
      <LoadingOverlay
        visible={fetchCommunityWithMediaFn.loading}
        overlayBlur={2}
      />
    );
  }

  if (!fetchCommunityWithMediaFn.value) {
    return <Text>Community does not exist</Text>;
  }

  return (
    <>
      <Head>
        <title>
          {`${
            fetchCommunityWithMediaFn.value &&
            fetchCommunityWithMediaFn.value.name
          }`}{" "}
          | FilmDB
        </title>
      </Head>
      <Container>
        <Stack className={classes.container}>
          <Title tt="capitalize">{fetchCommunityWithMediaFn.value.name}</Title>
          <Flex
            justify={{ default: "flex-start", lg: "space-between" }}
            gap="sm"
            align="center"
          >
            <AvatarMemberList
              members={fetchCommunityWithMediaFn.value.members}
            />
            <Flex gap="xs">
              <Tooltip label="Invite members">
                <ActionIcon onClick={openInviteModal}>
                  <IconUserPlus />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Edit Community">
                <ActionIcon
                  component={Link}
                  href={`/community/manage/${cSlug}`}
                >
                  <IconEdit />
                </ActionIcon>
              </Tooltip>
            </Flex>
          </Flex>
          <Title order={2} size="h3">
            Up Next
          </Title>
          {upcomingMedia ? (
            <div className={classes.mediaCard}>
              <UnstyledButton
                onClick={() => navigateToMediaPage(upcomingMedia)}
              >
                <Image
                  radius="sm"
                  src={`${TMDB_IMAGE_API_BASE_URL}/w${
                    isDesktop ? "342" : "185"
                  }/${upcomingMedia.posterPath}`}
                  alt={upcomingMedia.title}
                />
              </UnstyledButton>
            </div>
          ) : (
            <Card className={classes.mediaCard}>
              <Center>
                <Text>Add a movie to your queue!</Text>
              </Center>
            </Card>
          )}

          <Title order={2} size="h3">
            Watching Next
          </Title>
          {mediaCarousel(false)}
          <Title order={2} size="h3">
            Previously Watched
          </Title>
          {mediaCarousel(true)}
        </Stack>
      </Container>
    </>
  );
}

CommunityDashboard.auth = {
  unauthorized: "/auth/signin",
};
export default CommunityDashboard;
