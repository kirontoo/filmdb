import { useState } from "react";
import {
  createStyles,
  Header,
  Container,
  Group,
  Burger,
  Autocomplete,
  useMantineTheme,
  ActionIcon,
  rem,
} from "@mantine/core";
import {
  IconSearch,
  IconArrowRight,
  IconArrowLeft,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { buildTMDBQuery } from "@/lib/tmdb";
import { useMovieContext } from "@/context/MovieProvider";
import { Movie } from "@/lib/types";

const useStyles = createStyles((theme) => ({
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    height: "100%",
  },

  links: {
    [theme.fn.smallerThan("xs")]: {
      display: "none",
    },
  },

  burger: {
    [theme.fn.largerThan("xs")]: {
      display: "none",
    },
  },

  link: {
    display: "block",
    lineHeight: 1,
    padding: `${rem(8)} ${rem(12)}`,
    borderRadius: theme.radius.sm,
    textDecoration: "none",
    color:
      theme.colorScheme === "dark"
        ? theme.colors.dark[0]
        : theme.colors.gray[7],
    fontSize: theme.fontSizes.sm,
    fontWeight: 500,

    "&:hover": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[6]
          : theme.colors.gray[0],
    },
  },

  linkActive: {
    "&, &:hover": {
      backgroundColor: theme.fn.variant({
        variant: "light",
        color: theme.primaryColor,
      }).background,
      color: theme.fn.variant({ variant: "light", color: theme.primaryColor })
        .color,
    },
  },

  search: {
    "&:focus": {
      width: "100%",
    },
  },
}));

export interface NavLinkProp {
  link: string;
  label: string;
}

interface HeaderSimpleProps {
  links: NavLinkProp[];
}

export default function Navbar({ links }: HeaderSimpleProps) {
  const theme = useMantineTheme();
  const [opened, { toggle }] = useDisclosure(false);
  const [active, setActive] = useState(links[0].link);
  const { classes, cx } = useStyles();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const { setMovies } = useMovieContext();

  const searchMedia = (value: string) => {
    setSearchQuery(value);

    // API call HERE
    const query = encodeURI(`query=${value}&page=1`);
    const url = buildTMDBQuery("search/multi", query);
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const movies = data.results.filter((m: Movie) => m.media_type !== "person");
        setMovies(() => movies);
      });
  };

  const items = links.map((link) => (
    <Link
      key={link.label}
      href={link.link}
      className={cx(classes.link, {
        [classes.linkActive]: active === link.link,
      })}
      onClick={(event) => {
        event.preventDefault();
        setActive(link.link);
      }}
    >
      {link.label}
    </Link>
  ));

  return (
    <Header height={60} mb={120}>
      <Container className={classes.header} size="xl">
        <Group>
          <Link href="/">FilmDB</Link>
          <Group spacing={5} className={classes.links}>
            {items}
          </Group>
        </Group>
        <Group>
          <Autocomplete
            placeholder="Search"
            data={[]}
            onChange={setSearchQuery}
            value={searchQuery}
            icon={<IconSearch size="1.1rem" stroke={1.5} />}
            onKeyDown={({ key }) =>
              key === "Enter" ? searchMedia(searchQuery) : null
            }
            rightSection={
              <ActionIcon
                size={32}
                color={theme.primaryColor}
                onClick={() => searchMedia(searchQuery)}
              >
                {theme.dir === "ltr" ? (
                  <IconArrowRight size="1.1rem" stroke={1.5} />
                ) : (
                  <IconArrowLeft size="1.1rem" stroke={1.5} />
                )}
              </ActionIcon>
            }
            rightSectionWidth={42}
          />
        </Group>

        <Burger
          opened={opened}
          onClick={toggle}
          className={classes.burger}
          size="sm"
        />
      </Container>
    </Header>
  );
}
