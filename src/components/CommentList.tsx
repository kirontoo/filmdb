import { Stack, useMantineTheme, Button, Group } from "@mantine/core";
import { CommentTextEditor } from ".";

interface CommentListProps {
  children: React.ReactNode;
}

// Should load more comments as needed
function CommentList({ children }: CommentListProps) {
  const theme = useMantineTheme();
  return (
    <Stack spacing="xs">
        <CommentTextEditor />
        <Group position="right">
          <Button variant="light" size="sm">
            Comment
          </Button>
        </Group>

      {children}

      <Group position="center">
        <Button color={theme.primaryColor} tt="capitalize" variant="subtle">
          View More Comments
        </Button>
      </Group>
    </Stack>
  );
}

export default CommentList;
