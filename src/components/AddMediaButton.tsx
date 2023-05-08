import { Button, rem, createStyles } from "@mantine/core";
import { IconPlus, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { useCommunityContext } from "@/context/CommunityProvider";
import { useTheme } from "@emotion/react";
import CommunityMenu, { CommunityMenuActionProps } from "./CommunityMenu";
import { TMDBMedia } from "@/lib/types";
import Notify from "@/lib/notify";

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
    transition: "margin 0.3s ease-out",
  },
  btnLabel: {
    transform: "all 0.2s ease-out",
    visibility: "hidden",
    opactiy: 0,
    width: 0
  },
}));

interface AddMediaButtonProps {
  media: TMDBMedia;
}

export default function AddMediaButton({ media }: AddMediaButtonProps) {
  const [opened, setOpened] = useState(false);
  const { classes } = useStyles();

  const addToList = async (
    media: TMDBMedia,
    community: CommunityMenuActionProps,
    watched: boolean
  ) => {
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
          `${body.title} was added to ${watched ? "watched list" : "queued list"
          }`
        );
      } else {
        Notify.error(`${community.name}`, `${message}`);
      }
    } catch (e) {
      Notify.error(
        `${media.title ?? media.name ?? media.original_title
        } could not be added to ${community.name}`,
        "Please try again"
      );
    } finally {
    }
  };

  return (
    <CommunityMenu
      menuProps={{
        opened: opened,
        onChange: setOpened,
        classNames: classes,
        transitionProps: { transition: "scale", duration: 200 },
      }}
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
          leftIcon: opened ? classes.btnNoMargin : "",
          label: opened ? classes.btnLabel : "",
        }}
      >
        Add
      </Button>
    </CommunityMenu>
  );
}