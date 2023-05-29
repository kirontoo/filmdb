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
import { useEffect } from "react";
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
}));

function CommunityDashboard() {
  const router = useRouter();
  const { classes } = useStyles();
  const { setLoading } = useLoadingContext();
  const { currentCommunity, setCurrentCommunity, isFetching, communities, currentCommunityIndex } =
    useCommunityContext();
  const { setMedias, medias } = useMediaContext();
  const { slug } = router.query;
  const { data: session } = useSession();
  const isDesktop = useIsDesktopDevice();

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
        const id = communities[currentCommunityIndex].id;
        const res = await fetch(`/api/community/${id}/media`);
        if (res.ok) {
          const { data } = await res.json();
          setMedias(data.medias);
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
      innerProps: { media },
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
        <title>FilmDB | {`${currentCommunity && currentCommunity.name}`}</title>
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
          <Group position="apart">
            <Title order={2} size="h3">
              Watching Next
            </Title>
            <Button compact variant="subtle" color="gray">
              see more
            </Button>
          </Group>
          {mediaCarousel(true)}
          <Group position="apart">
            <Title order={2} size="h3">
              Previously Watched
            </Title>
            <Button compact variant="subtle" color="gray">
              see more
            </Button>
          </Group>
          {mediaCarousel(false)}
        </Stack>
      </Container>
    </>
  );
}

CommunityDashboard.auth = {
  unauthorized: "/auth/signin",
};
export default CommunityDashboard;
