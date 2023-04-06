import {
  createStyles,
  Container,
  Title,
  Text,
  Button,
  Group,
  rem,
} from "@mantine/core";
import NotFoundIllustration from "./NothingFoundIllustration";
import Link from "next/link";
import { ReactNode } from "react";

const useStyles = createStyles((theme) => ({
  root: {
    paddingTop: rem(80),
    paddingBottom: rem(80),
  },

  inner: {
    position: "relative",
  },

  image: {
    ...theme.fn.cover(),
    opacity: 0.75,
  },

  content: {
    paddingTop: rem(220),
    position: "relative",
    zIndex: 1,

    [theme.fn.smallerThan("sm")]: {
      paddingTop: rem(120),
    },
  },

  title: {
    fontFamily: `Greycliff CF, ${theme.fontFamily}`,
    textAlign: "center",
    fontWeight: 900,
    fontSize: rem(38),

    [theme.fn.smallerThan("sm")]: {
      fontSize: rem(32),
    },
  },

  description: {
    maxWidth: rem(540),
    margin: "auto",
    marginTop: theme.spacing.xl,
    marginBottom: `calc(${theme.spacing.xl} * 1.5)`,
  },
}));

interface NothingFoundBackgroundProps {
  description?: string;
  title?: string;
  backgroundImage?: boolean;
  btnLink?: string;
  btnText?: string;
}

export default function NothingFoundBackground({
  title,
  description,
  backgroundImage,
  btnLink,
  btnText,
}: NothingFoundBackgroundProps) {
  const { classes } = useStyles();
  title = title ?? "Nothing to see here";
  description =
    description ??
    "Page you are trying to open does not exist. You may have mistyped the address, or the page has been moved to another URL. If you think this is an error contact support.";
  backgroundImage = backgroundImage ?? true;

  return (
    <Container className={classes.root}>
      <div className={classes.inner}>
        {backgroundImage && <NotFoundIllustration className={classes.image} />}
        <div className={classes.content}>
          <Title className={classes.title}>{title}</Title>
          <Text
            color="dimmed"
            size="lg"
            align="center"
            className={classes.description}
          >
            {description}
          </Text>
          <Group position="center">
            <Button size="md" component={Link} href={btnLink ?? "/"} variant="subtle">
              {btnText ?? "Take me back to home page"}
            </Button>
          </Group>
        </div>
      </div>
    </Container>
  );
}
