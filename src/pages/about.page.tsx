import {
  Stack,
  Text,
  Center,
  Divider,
  Container,
  Title,
  Anchor,
} from "@mantine/core";
import Link from "next/link";

export default function About() {
  return (
    <Container py={16}>
      <Stack>
        <Center>
          <Title>About Us</Title>
        </Center>
        <Divider />
        <Text>
          Hey there, movie buffs! We&apos;re excited to introduce you to our web
          app that makes it easy to track the movies you&apos;ve watched and
          create a to-watch list for your next movie night.
        </Text>

        <Text>
          Our app was inspired by all the amazing watch parties and movie nights
          we&apos;ve had with our friends and communities on Twitch. We wanted a
          simple way to keep track of the movies we&apos;ve seen and get
          recommendations for what to watch next, all in one place.
        </Text>

        <Text>
          But we didn&apos;t just want our app to be functional - we wanted it
          to be fun and easy to use, too. That&apos;s why we worked with a
          talented UI/UX designer to create an app that not only works great,
          but looks amazing too.
        </Text>

        <Text>
          So go ahead,{" "}
          <Anchor component={Link} href="/auth/signin">
            sign up
          </Anchor>{" "}
          for our app, create your own community, and start tracking your movie
          watching journey. We can&apos;t wait to see what you&apos;ll watch
          next!
        </Text>

        <Center>
          <Title>Credits</Title>
        </Center>
        <Divider />
        <Text>
          This product uses the TMDb API but is not endorsed or certified by
          TMDb. All info and images are sourced from{" "}
          <Anchor href="https://www.themoviedb.org/">The Movie Database</Anchor>.
        </Text>
      </Stack>
    </Container>
  );
}
