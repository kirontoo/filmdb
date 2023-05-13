import { createStyles, Text, Avatar, Group, rem } from "@mantine/core";

const useStyles = createStyles((theme) => ({
  body: {
    paddingLeft: rem(54),
    paddingTop: theme.spacing.sm,
  },
}));

interface CommentProps {
  createdAt: string;
  body: string;
  author: {
    name: string;
    image: string;
  };
}

function Comment({ createdAt, body, author }: CommentProps) {
  const { classes } = useStyles();
  return (
    <div>
      <Group>
        <Avatar src={author.image} alt={author.name} radius="xl" />
        <div>
          <Text size="sm">{author.name}</Text>
          <Text size="xs" color="dimmed">
            {createdAt}
          </Text>
        </div>
      </Group>
      <Text className={classes.body} size="sm">
        {body}
      </Text>
    </div>
  );
}

export default Comment;
