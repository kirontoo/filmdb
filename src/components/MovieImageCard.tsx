import {
  getStylesRef,
  createStyles,
  Card,
  Text,
  Title,
  rem,
} from "@mantine/core";
import { IconStarFilled } from "@tabler/icons-react";

const useStyles = createStyles((theme) => ({
  card: {
    height: rem(440),
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundColor:
      theme.colorScheme === "dark"
        ? theme.colors.dark[6]
        : theme.colors.gray[0],
    [`&:hover .${getStylesRef("image")}`]: {
      transform: "scale(1.15)",
    },
  },

  image: {
    ...theme.fn.cover(),
    ref: getStylesRef("image"),
    backgroundSize: "cover",
    transition: "transform 500ms ease",
  },

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage:
      "linear-gradient(180deg, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0) 90%)",
  },

  title: {
    fontFamily: `Greycliff CF ${theme.fontFamily}`,
    fontWeight: 900,
    color: theme.white,
    lineHeight: 1.2,
    fontSize: rem(32),
    marginTop: theme.spacing.xs,
  },

  date: {
    color: theme.white,
    opacity: 0.7,
    fontWeight: 700,
    textTransform: "uppercase",
  },

  rating: {
    color: theme.white,
    opacity: 0.9,
    fontWeight: 700,
    textTransform: "uppercase",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: rem(5),
  },

  content: {
    position: "relative",
  },
}));

interface MovieImageCardProps {
  image: string;
  title: string;
  releaseDate: string;
  rating: number;
  id: number;
  mediaType: string,
}

export default function MovieImageCard({
  image,
  title,
  releaseDate,
  rating,
  id,
  mediaType,
}: MovieImageCardProps) {
  const { classes } = useStyles();

  return (
    <Card p="lg" shadow="lg" className={classes.card} radius="md" component="a" href={`/media/${mediaType}/${id}`}>
      <div
        className={classes.image}
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className={classes.overlay} />

      <div className={classes.content}>
        <Text className={classes.date} size="xs">
          {releaseDate}
        </Text>
        <Title order={3} className={classes.title}>
          {title}
        </Title>
      </div>
      <div className={classes.rating}>
        <IconStarFilled style={{ position: "relative", color: "yellow" }} />
        <Text>{rating}</Text>
      </div>
    </Card>
  );
}
