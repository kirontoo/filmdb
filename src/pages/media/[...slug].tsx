import { useRouter } from "next/router";
import { Button, createStyles, Container, LoadingOverlay } from "@mantine/core";
import useSwr from "swr";
import { buildTMDBQuery } from "@/lib/tmdb";
import { Media as MediaType } from "@/lib/types";

const useStyles = createStyles((theme) => ({
  addBtn: {
    textTransform: "uppercase",
  },
}));

export default function Media() {
  const router = useRouter();
  const slug = (router.query.slug as string[]) || [];
  const { classes } = useStyles();

  const fetcher = (url: string) => fetch(url).then((res) => res.json());

  const { data, error, isLoading, mutate } = useSwr<MediaType>(
    buildTMDBQuery(`${slug[0]}/${slug[1]}`),
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  return (
    <Container size="xl">
      {isLoading && data !== undefined ? (
        <LoadingOverlay overlayBlur={2} visible={true} />
      ) : (
        <>
          <div>id: {slug[1]}, name: {data.name}</div>
          <Button className={classes.addBtn}>Add to watched list</Button>
        </>
      )}
    </Container>
  );
}
