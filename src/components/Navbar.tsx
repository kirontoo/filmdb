import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Center,
  Menu,
  Button,
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
  IconChevronDown,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { LoginBtn, ToggleDarkTheme } from ".";
import { useSession } from "next-auth/react";
import { useCommunityContext } from "@/context/CommunityProvider";

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
  linkLabel: {
    marginRight: rem(5),
  },

  search: {
    [theme.fn.smallerThan("xs")]: {
      display: "none",
    },
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
  links?: NavLinkProp[];
}

export default function Navbar({ links }: HeaderSimpleProps) {
  const theme = useMantineTheme();
  const [opened, { toggle }] = useDisclosure(false);
  const [active, setActive] = useState(
    links !== undefined ? links[0].link : ""
  );
  const { classes, cx } = useStyles();
  const router = useRouter();
  const { data: session } = useSession();
  // const [communities, setCommunities] = useState<CommunityLink[]>([]);
  const { communities, setCommunities, setCurrentCommunityIndex } =
    useCommunityContext();

  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        let res = await fetch("/api/community");
        let { data } = await res.json();
        setCommunities(data.communities);
        if (data.communities.length > 0) {
          setCurrentCommunityIndex(0);
        }
      } catch (e) {
        setCommunities([]);
        setCurrentCommunityIndex(-1);
      }
    })();
  }, [session]);

  const searchMedia = (value: string) => {
    if (value !== "") {
      setSearchQuery(value);
      router.push(`/media/search?media=${encodeURI(value)}`);
    }
  };

  const items = links?.map((link) => (
    <Link
      key={link.label}
      href={link.link}
      className={cx(classes.link, {
        [classes.linkActive]: active === link.link,
      })}
      onClick={() => {
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
            {session && (
              <Menu trigger="hover" transitionProps={{ exitDuration: 0 }}>
                <Menu.Target>
                  <Link href="/community" className={classes.link}>
                    <Center>
                      <span className={classes.linkLabel}>community</span>
                      <IconChevronDown size="0.9rem" stroke={1.5} />
                    </Center>
                  </Link>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>Your Communities</Menu.Label>
                  {communities.map((c) => (
                    <Menu.Item
                      key={c.slug}
                      component={Link}
                      href={`/community/${c.slug}`}
                    >
                      {c.name}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>
        </Group>
        <Group>
          <Autocomplete
            className={classes.search}
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

          {!session && (
            <Button variant="subtle" component={Link} href="/community/join">
              Join Community
            </Button>
          )}

          <LoginBtn />

          <ToggleDarkTheme />
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
