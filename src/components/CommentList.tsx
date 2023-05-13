import { Stack, createStyles, useMantineTheme, Button } from "@mantine/core";

interface CommentListProps {
  children: React.ReactNode;
}

const useStyles = createStyles((theme) => ({}));

// Should load more comments as needed
function CommentList({ children }: CommentListProps) {
  const theme = useMantineTheme();
  return (
    <Stack>
      {children}

      <Button color={theme.primaryColor} tt="capitalize">
        View More Comments
      </Button>
    </Stack>
  );
}

export default CommentList;
