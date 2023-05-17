import { Box, Flex, Group, Skeleton } from "@mantine/core";

const SkeletonComment = () => {
  return (
    <div>
      <Flex>
        <Skeleton height={50} circle mb="xl" />
        <Box w="100%" ml="1rem" pt="0.5rem">
          <Skeleton height={8} width="20%" radius="xl" />
          <Skeleton height={8} width="30%" mt={6} radius="xl" />
        </Box>
      </Flex>
      <Skeleton height={8} radius="xl" />
      <Skeleton height={8} mt={6} radius="xl" />
      <Skeleton height={8} mt={6} width="70%" radius="xl" />
    </div>
  );
};

export default SkeletonComment;
