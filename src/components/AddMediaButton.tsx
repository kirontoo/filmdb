import { Button, rem, createStyles, MenuProps } from "@mantine/core";
import { IconPlus, IconX } from "@tabler/icons-react";
import { useState } from "react";
import CommunityMenu, { CommunityMenuActionProps } from "./CommunityMenu";
import { TMDBMedia } from "@/lib/types";
import Notify from "@/lib/notify";
import { useSession } from "next-auth/react";
import Link from "next/link";

const useStyles = createStyles((theme) => ({
  dropdown: {
    backgroundColor: theme.black,
  },
  label: {
    fontWeight: "bold",
    fontSize: theme.fontSizes.md,
    color: theme.white,
  },
  btnNoMargin: {
    marginRight: 0,
    transition: "margin 0.2s ease-out",
  },
  btnLabel: {
    transform: "all 0.2s ease-out",
    visibility: "hidden",
    opactiy: 0,
    width: 0,
  },
  btnMargin: {
    transition: "margin 0.2s ease-out",
  },
  btnTransition: {
    transform: "all 0.2s ease-out",
    opactiy: 1,
    width: "100%",
    visibility: "visible",
  },
}));

interface AddMediaButtonProps {
  media: TMDBMedia;
  menuProps?: MenuProps;
}

export default function AddMediaButton({
  menuProps,
  media,
}: AddMediaButtonProps) {
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false);
  const { classes } = useStyles();
  const { data: session } = useSession();

  const addToList = async (
    media: TMDBMedia,
    community: CommunityMenuActionProps,
    watched: boolean
  ) => {
    setLoading(true);
    try {
      const body = {
        ...media,
        tmdbId: media.id,
        mediaType: media.media_type,
        title: media.title ?? media.name ?? media.original_title,
        watched,
        posterPath: media.poster_path,
        backdropPath: media.backdrop_path,
      };

      const res = await fetch(`/api/community/${community.id}`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const { message } = await res.json();

      if (res.ok) {
        Notify.success(
          `${community.name}`,
          `${body.title} was added to ${
            watched ? "watched list" : "queued list"
          }`
        );
      } else {
        Notify.error(`${community.name}`, `${message}`);
      }
    } catch (e) {
      Notify.error(
        `${
          media.title ?? media.name ?? media.original_title
        } could not be added to ${community.name}`,
        "Please try again"
      );
    } finally {
      setLoading(false);
    }
  };

  if (session) {
    return (
      <CommunityMenu
        menuProps={{
          opened: opened,
          onChange: setOpened,
          classNames: classes,
          transitionProps: { transition: "scale", duration: 200 },
          ...menuProps,
        }}
        title="Add to Community Queue:"
        menuAction={(c: CommunityMenuActionProps) => addToList(media, c, false)}
      >
        <Button
          leftIcon={
            opened ? <IconX size={rem(16)} /> : <IconPlus size={rem(16)} />
          }
          radius="xl"
          size="sm"
          compact
          color="violet.4"
          classNames={{
            leftIcon: opened ? classes.btnNoMargin : classes.btnMargin,
            label: opened ? classes.btnLabel : classes.btnTransition
          }}
          loading={loading}
          uppercase
        >
          Add
        </Button>
      </CommunityMenu>
    );
  }
  return (
    <Button
      radius="xl"
      size="sm"
      compact
      color="violet.4"
      uppercase
      component={Link}
      href="/auth/signin"
    >
      Login to add
    </Button>
  );
}
