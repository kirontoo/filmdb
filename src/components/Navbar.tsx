import { useState } from "react";
import { useRouter } from "next/router";
import {
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
import { IconSearch, IconArrowRight, IconArrowLeft } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { LoginBtn } from ".";
import { useSession } from "next-auth/react";

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

  const [searchQuery, setSearchQuery] = useState<string>("");

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
      onClick={(event) => {
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
