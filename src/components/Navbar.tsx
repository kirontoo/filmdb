import { useState } from "react";
import {
  Center,
  Menu,
  createStyles,
  Header,
  Text,
  Container,
  Group,
  Burger,
  ActionIcon,
  rem,
} from "@mantine/core";
import { IconSearch, IconChevronDown } from "@tabler/icons-react";
import Link from "next/link";
import { LoginBtn } from ".";
import { useSession } from "next-auth/react";
import { useCommunityContext } from "@/context/CommunityProvider";
import { useNavContext } from "@/context/NavProvider";

const useStyles = createStyles((theme) => ({
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    height: "100%",
  },

  links: {
    [theme.fn.smallerThan("lg")]: {
      display: "none",
    },
  },

  burger: {
    [theme.fn.largerThan("lg")]: {
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
    [theme.fn.smallerThan("lg")]: {
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
  const { openedNavSidebar, navSidebarControls } = useNavContext();

  const [active, setActive] = useState(
    links !== undefined && links.length > 0 ? links[0].link : ""
  );
  const { classes, cx } = useStyles();
  const { data: session } = useSession();
  const { communities } = useCommunityContext();

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
    <Header height={60} sx={{ background: "black" }}>
      <Container className={classes.header} size="xl">
        <Group>
          <Burger
            opened={openedNavSidebar}
            onClick={navSidebarControls.toggle}
            className={classes.burger}
            size="sm"
          />
          <Link href="/">
            <Text color="violet.4" tt="uppercase" weight="bold" fz="xl">
              FilmDB
            </Text>
          </Link>
          <Group spacing={5} className={classes.links}>
            {items}
            <Link
              href="/"
              className={cx(classes.link, {
                [classes.linkActive]: active === "/",
              })}
              onClick={() => {
                setActive("/");
              }}
            >
              Trending
            </Link>

            {session && (
              <Menu trigger="hover" transitionProps={{ exitDuration: 0 }}>
                <Menu.Target>
                  <Link href="/community" className={classes.link}>
                    <Center>
                      <span className={classes.linkLabel}>Community</span>
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

            <Link
              href="/about"
              className={cx(classes.link, {
                [classes.linkActive]: active === "/about",
              })}
              onClick={() => {
                setActive("/about");
              }}
            >
              About Us
            </Link>
          </Group>
        </Group>
        <Group>
          <ActionIcon component={Link} href="/media/search">
            <IconSearch size="1.1rem" stroke={1.5} />
          </ActionIcon>

          <LoginBtn />
        </Group>
      </Container>
    </Header>
  );
}
