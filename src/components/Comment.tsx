import {
  createStyles,
  Text,
  Avatar,
  Group,
  rem,
  Button,
  Spoiler,
  TypographyStylesProvider,
  Collapse,
  Space,
  Stack,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import CommentTextEditor from "./CommentTextEditor";

const useStyles = createStyles((theme) => ({
  body: {
    paddingLeft: rem(54),
    paddingTop: theme.spacing.sm,
  },
  actionBar: {
    paddingLeft: rem(54),
  },
  content: {
    fontSize: theme.fontSizes.md,
    "& > p:last-child": {
      marginBottom: 0,
    },
  },
}));

interface CommentProps {
  createdAt: any;
  body: string;
  author: {
    name: string;
    image: string;
  };
}

function Comment({ createdAt, body, author }: CommentProps) {
  const { classes } = useStyles();
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <div>
      <Group>
        <Avatar src={author.image} alt={author.name} radius="xl" />
        <div>
          <Text size="md">{author.name}</Text>
          <Text size="xs" color="dimmed">
            {createdAt}
          </Text>
        </div>
      </Group>
      <Spoiler
        className={classes.body}
        maxHeight={100}
        showLabel="Read more"
        hideLabel="Show less"
      >
        <TypographyStylesProvider>
          <div
            className={classes.content}
            dangerouslySetInnerHTML={{ __html: body }}
          />
        </TypographyStylesProvider>
      </Spoiler>
      <Group className={classes.body}>
        <Button color="gray" compact variant="subtle" onClick={open}>
          Reply
        </Button>
        <Collapse in={opened}>
          <Stack>
            <CommentTextEditor />
            <Group position="right">
              <Button variant="subtle" color="gray" onClick={close}>
                Cancel
              </Button>
              <Button variant="light">Comment</Button>
            </Group>
          </Stack>
        </Collapse>
      </Group>
    </div>
  );
}

export default Comment;
