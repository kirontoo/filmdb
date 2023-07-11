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
} from "@mantine/core";
import Head from "next/head";
import { AvatarMemberList } from "@/components";
import { TMDB_IMAGE_API_BASE_URL } from "@/lib/tmdb";
import { useEffect, useState } from "react";
import { Media } from "@prisma/client";

import { Carousel } from "@mantine/carousel";
import { modals } from "@mantine/modals";
import {
  CommunityWithMembers,
  useCommunityContext,
} from "@/context/CommunityProvider";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

import useIsDesktopDevice from "@/lib/hooks/useIsDesktopDevice";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import useAsyncFn from "@/lib/hooks/useAsyncFn";
import { fetchMedias } from "@/services/medias";
import { useLoadingContext } from "@/context/LoadingProvider";

const useStyles = createStyles((theme) => ({
  container: {
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
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
  const { getCommunity } = useCommunityContext();
  const { isLoading } = useLoadingContext();
  const { slug } = router.query;
  const { data: session } = useSession();
  const isDesktop = useIsDesktopDevice();
  const [upcomingMedia, setUpcomingMedia] = useState<Media | null>(null);
  const communitySlug = Array.isArray(slug) ? slug[0] : slug;
  const [community, setCommunity] = useState<CommunityWithMembers | null>(
    getCommunity(communitySlug!)
  );

  useEffect(() => {
    if (community && communitySlug) {
      if (community.slug !== communitySlug) {
        setCommunity(getCommunity(communitySlug));
      }
    }
  }, [slug]);

  useEffect(() => {
    if (session && !isLoading) {
      onLoadData();
    }
  }, [slug, session, isLoading]);

  const fetchMediasFn = useAsyncFn(fetchMedias);

  const onLoadData = async () => {
    if (fetchMediasFn.loading) {
      return;
    }

    try {
      const cSlug = Array.isArray(slug) ? slug[0] : slug;
      setCommunity(getCommunity(cSlug!));
      const medias = await fetchMediasFn.execute({ slug: cSlug });
      const upcoming = medias.find((m: Media) => m.queue ?? 0 > 0) ?? null;
      setUpcomingMedia(upcoming);
    } catch (error) {}
  };

  const openMediaModal = (media: Media) => {
    modals.openContextModal({
      modal: "media",
      title: `${media.title}`,
      size: "xl",
      innerProps: { media, communityId: community!.id },
    });
  };

  const openInviteModal = () => {
    modals.open({
      title: "Invite Code",
      children: (
        <>
          <Group>
            <Text fz="xl">{community!.inviteCode}</Text>
            <CopyButton
              value={`${origin}/community/join?code=${community!.inviteCode}`}
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
        {fetchMediasFn.value &&
          fetchMediasFn.value
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

  if (!community) {
    return <Text>Community does not exist</Text>;
  }

  if (fetchMediasFn.loading || isLoading) {
    return <LoadingOverlay visible={fetchMediasFn.loading} overlayBlur={2} />;
  }

  return (
    <>
      <Head>
        <title>{`${community && community.name}`} | FilmDB</title>
      </Head>
      <Container>
        <Stack className={classes.container}>
          <Title tt="capitalize">{community.name}</Title>
          <Group position="apart">
            <AvatarMemberList members={community.members} />
            <Button compact onClick={openInviteModal}>
              Invite
            </Button>
          </Group>
          <Group position="apart">
            <Title order={2} size="h3">
              Upcoming
            </Title>
          </Group>
          {upcomingMedia ? (
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
