import {
  Container,
  Grid,
  LoadingOverlay,
  Title,
  Paper,
  Button,
  Flex,
  rem,
  Card,
  Text,
  Stack,
  Divider,
} from "@mantine/core";
import { GetServerSidePropsContext } from "next";
import { useMediaContext } from "@/context/MediaProvider";
import { MediaImageCard } from "@/components";
import { TMDB_IMAGE_API_BASE_URL } from "@/lib/tmdb";
import { useState } from "react";
import { useClipboard, useDisclosure } from "@mantine/hooks";
import { Community, Media } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]";
import prisma from "@/lib/prismadb";
import { IconCopy, IconCheck } from "@tabler/icons-react";

type CommunityWithMedia = {
  medias: Media[];
} & Community;

interface CommunityDashboardProps {
  community: Community | null;
}

function CommunityDashboard({ community }: CommunityDashboardProps) {
  const { medias } = useMediaContext();
  const [visible, handlers] = useDisclosure(false);
  const [isLoading, setLoading] = useState(false);
  const clipboard = useClipboard();
  return (
    <>
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
                    </Stack>
                    <Card
                      withBorder
                      radius="md"
                      padding="xl"
                      sx={(theme) => ({
                        backgroundColor:
                          theme.colorScheme === "dark"
                            ? theme.colors.dark[7]
                            : theme.white,
                      })}
                    >
                      <Flex justify="space-between" align="center" gap="md">
                        <Stack spacing="xs">
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
                        <Button
                          variant="light"
                          rightIcon={
                            clipboard.copied ? (
                              <IconCheck size="1.2rem" stroke={1.5} />
                            ) : (
                              <IconCopy size="1.2rem" stroke={1.5} />
                            )
                          }
                          radius="xl"
                          size="md"
                          styles={{
                            root: { paddingRight: rem(14), height: rem(48) },
                            rightIcon: { marginLeft: rem(22) },
                          }}
                          onClick={() =>
                            clipboard.copy(
                              `${window.location.host}/community/join?code=${community.inviteCode}`
                            )
                          }
                        >
                          Copy invite link to clipboard
                        </Button>
                      </Flex>
                    </Card>
                  </Flex>
                </Paper>
                <Divider my="md" />
                <Grid grow={false} columns={4}>
                  {medias.map((m) => {
                    return (
                      <Grid.Col sm={2} lg={1} key={m.id}>
                        <MediaImageCard
                          image={`${TMDB_IMAGE_API_BASE_URL}/w500/${m.poster_path}`}
                          title={m.title}
                          releaseDate={m.release_date}
                          rating={m.vote_average}
                          mediaType="movie"
                          id={m.id}
                        />
                      </Grid.Col>
                    );
                  })}
                </Grid>
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
      console.log(community);
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
