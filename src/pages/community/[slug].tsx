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
} from "@mantine/core";
import Head from "next/head";
import { AvatarMemberList } from "@/components";
import { TMDB_IMAGE_API_BASE_URL } from "@/lib/tmdb";
import { useEffect, useState } from "react";
import { Media } from "@prisma/client";

import { Carousel } from "@mantine/carousel";
import { modals } from "@mantine/modals";
import { useCommunityContext } from "@/context/CommunityProvider";
import { useRouter } from "next/router";
import { useMediaContext } from "@/context/MediaProvider";
import { useLoadingContext } from "@/context/LoadingProvider";
import { useSession } from "next-auth/react";

import useIsDesktopDevice from "@/lib/hooks/useIsDesktopDevice";
import { IconCheck, IconCopy } from "@tabler/icons-react";

const useStyles = createStyles((theme) => ({
  container: {
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  mediaCard: {
    [`@media (min-width:${theme.breakpoints.md})`]: {
      width: "27%",
    },
    [`@media (max-width:${theme.breakpoints.md})`]: {
      width: "29%",
    },
  },
}));

function CommunityDashboard() {
  const router = useRouter();
  const { classes } = useStyles();
  const { setLoading } = useLoadingContext();
  const { setCurrentCommunity, currentCommunity, isFetching } =
    useCommunityContext();
  const { setMedias, medias } = useMediaContext();
  const { slug } = router.query;
  const { data: session } = useSession();
  const isDesktop = useIsDesktopDevice();
  const [upcomingMedia, setUpcomingMedia] = useState<Media | null>(null);
    const communitySlug = Array.isArray(slug) ? slug[0] : slug;

  useEffect(() => {
    if (currentCommunity && communitySlug) {
      if (currentCommunity.slug !== communitySlug) {
        router.push(`/community/${currentCommunity.slug}`);
      }
    }
  }, [currentCommunity]);

  useEffect(() => {
    if (session && !isFetching) {
      if (communitySlug) {
        setCurrentCommunity(communitySlug);
      }
      if (currentCommunity!.slug == communitySlug) {
        loadData();
      }
    }
  }, [slug, session, isFetching]);

  async function loadData() {
    setLoading(true);
    try {
      if (communitySlug) {
        const res = await fetch(`/api/community/${communitySlug}/media`);
        if (res.ok) {
          const { data } = await res.json();
          const upcoming = data.medias.find((m: Media) => m.queue === 1);
          setUpcomingMedia(upcoming);
          setMedias(
            data.medias.sort((a: Media, b: Media) => {
              const qA = a.queue ?? 0;
              const qB = b.queue ?? 0;
              if (qA < qB) {
                return -1;
              }
              if (qA > qB) {
                return 1;
              }
              return 0;
            })
          );
        } else {
          throw new Error("community does not exist");
        }
      }
    } catch (e) {
      router.push("/404");
    } finally {
      setLoading(false);
    }
  }

  const openMediaModal = (media: Media) => {
    modals.openContextModal({
      modal: "media",
      title: `${media.title}`,
      size: "xl",
      innerProps: { media, communityId: currentCommunity!.id },
    });
  };

  const openInviteModal = () => {
    modals.open({
      title: "Invite Code",
      children: (
        <>
          <Group>
            <Text fz="xl">{currentCommunity!.inviteCode}</Text>
            <CopyButton
              value={`${origin}/community/join?code=${
                currentCommunity!.inviteCode
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
          </Group>
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
        {medias
          .filter((m) => m.watched === watched)
          .map((m) => (
            <Carousel.Slide key={m.id}>
              <UnstyledButton onClick={() => openMediaModal(m)}>
                <Image
                  radius="sm"
                  src={`${TMDB_IMAGE_API_BASE_URL}/w${
                    isDesktop ? "342" : "185"
                  }/${m.posterPath}`}
                  alt={m.title}
                />
              </UnstyledButton>
            </Carousel.Slide>
          ))}
      </Carousel>
    );
  };

  if (!currentCommunity) {
    return <Text>Community does not exist</Text>;
  }

  return (
    <>
      <Head>
        <title>{`${currentCommunity && currentCommunity.name}`} | FilmDB</title>
      </Head>
      <Container>
        <Stack className={classes.container}>
          <Title tt="capitalize">{currentCommunity.name}</Title>
          <Group position="apart">
            <AvatarMemberList members={currentCommunity.members} />
            <Button compact onClick={openInviteModal}>
              Invite
            </Button>
          </Group>
          <Group position="apart">
            <Title order={2} size="h3">
              Upcoming
            </Title>
          </Group>
          {upcomingMedia && (
            <div className={classes.mediaCard}>
              <UnstyledButton onClick={() => openMediaModal(upcomingMedia)}>
                <Image
                  radius="sm"
                  src={`${TMDB_IMAGE_API_BASE_URL}/w${
                    isDesktop ? "342" : "185"
                  }/${upcomingMedia.posterPath}`}
                  alt={upcomingMedia.title}
                />
              </UnstyledButton>
            </div>
          )}

          <Group position="apart">
            <Title order={2} size="h3">
              Watching Next
            </Title>
            <Button compact variant="subtle" color="gray">
              see more
            </Button>
          </Group>
          {mediaCarousel(false)}
          <Group position="apart">
            <Title order={2} size="h3">
              Previously Watched
            </Title>
            <Button compact variant="subtle" color="gray">
              see more
            </Button>
          </Group>
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
