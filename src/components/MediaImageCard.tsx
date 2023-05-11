import {
  getStylesRef,
  createStyles,
  Card,
  rem,
  createPolymorphicComponent,
  Center,
} from "@mantine/core";
import { ReactNode, forwardRef } from "react";
import { ReactJSXElement } from "@emotion/react/types/jsx-namespace";
import { IconPhoto } from "@tabler/icons-react";

const useStyles = createStyles((theme) => ({
  card: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor:
      theme.colorScheme === "dark"
        ? theme.colors.dark[6]
        : theme.colors.gray[0],
    [`&:hover .${getStylesRef("image")}`]: {
      transform: "scale(1.05)",
    },
    border: "none",
    width: "100%",
    minHeight: rem("300px"),
    [`@media(min-width: ${theme.breakpoints.md})`]: {
      width: "100%",
      height: rem("400px"),
    },
  },

  placeholderImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    top: 0,
    left: 0,
  },

  image: {
    ...theme.fn.cover(),
    ref: getStylesRef("image"),
    backgroundSize: "cover",
    backgroundPosition: "center",
    transition: "transform 500ms ease",
    backgroundRepeat: "no-repeat",
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

  content: {
    position: "relative",
  },
}));

interface MediaImageCardProps {
  image?: string | null;
  children?: ReactNode;
  className?: any;
}

const _MediaImageCard = forwardRef<HTMLDivElement, MediaImageCardProps>(
  ({ image, children, className, ...others }, ref) => {
    const { classes, cx } = useStyles();
    console.log(image);

    return (
      <Card
        ref={ref}
        p="md"
        shadow="lg"
        className={cx(classes.card, className)}
        radius="md"
        component="div"
        {...others}
      >
        {image !== null ? (
          <div
            className={classes.image}
            style={{ backgroundImage: `url(${image ?? ""})` }}
          />
        ) : (
          <Center className={classes.placeholderImage}>
            <IconPhoto size="2rem" />
          </Center>
        )}
        <div className={classes.overlay} />
        {children}
      </Card>
    );
  }
);
_MediaImageCard.displayName = "_MediaImageCard";

export function MediaImageCardHeader({
  children,
  className,
  ...props
}: {
  children?: ReactNode;
  className?: any;
}): ReactJSXElement {
  const { classes, cx } = useStyles();
  return (
    <header className={cx(classes.content, className)} {...props}>
      {children}
    </header>
  );
}

export function MediaImageCardFooter({
  children,
  ...props
}: {
  children?: ReactNode;
  className?: any;
}): ReactJSXElement {
  return <footer {...props}>{children}</footer>;
}

const MediaImageCard = createPolymorphicComponent<"div", MediaImageCardProps>(
  _MediaImageCard
);

export default MediaImageCard;
