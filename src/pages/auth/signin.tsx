import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";
import { getProviders, signIn } from "next-auth/react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import {
  Overlay,
  Container,
  Space,
  BackgroundImage,
  Text,
  Button,
  ButtonProps,
  Stack,
  Image,
} from "@mantine/core";
import { IconBrandDiscord } from "@tabler/icons-react";
import useIsDesktopDevice from "@/lib/hooks/useIsDesktopDevice";

// source: https://github.com/mantinedev/ui.mantine.dev/blob/master/components/SocialButtons/GoogleIcon.tsx
interface GoogleIconProps extends React.ComponentPropsWithoutRef<"svg"> {
  size?: string;
}

export function GoogleIcon({ size, ...props }: GoogleIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid"
      viewBox="0 0 256 262"
      width={size ? size : "1rem"}
      height={size ? size : "1rem"}
      {...props}
    >
      <path
        fill="#4285F4"
        d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
      />
      <path
        fill="#34A853"
        d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
      />
      <path
        fill="#FBBC05"
        d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
      />
      <path
        fill="#EB4335"
        d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
      />
    </svg>
  );
}

interface AuthButtonProps extends ButtonProps {
  providerId: string;
  iconSize?: string;
}

export function GoogleButton({ iconSize, ...props }: AuthButtonProps) {
  return (
    <Button
      onClick={() => signIn(props.providerId)}
      leftIcon={<GoogleIcon size={iconSize} />}
      variant="default"
      color="gray"
      {...props}
    />
  );
}

export function DiscordButton(props: AuthButtonProps) {
  return (
    <Button
      onClick={() => signIn(props.providerId)}
      leftIcon={<IconBrandDiscord size="1.5rem" color="#5865F2" />}
      color="gray"
      {...props}
    />
  );
}

export default function SignIn({
  providers,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const matches = useIsDesktopDevice();

  return (
    <>
      <BackgroundImage
        src="https://designwithred.com/wp-content/uploads/2020/09/42-Best-Movie-Posters-of-2019-DesignwithRed.jpg"
        sx={{
          backgroundSize: "contain",
          backgroundPosition: "center",
          height: "100vh",
        }}
      >
        <Overlay gradient="linear-gradient(180deg, rgba(151, 117, 250, 0.35) 0%, rgba(0, 0, 0, 0.6) 40%)" />
        <Overlay gradient="linear-gradient(180deg, rgba(0, 0, 0, 0.01) 0%, #000000 80.21%);" />
        <Container
          h="100%"
          size="xs"
          sx={{ zIndex: 300, position: "relative" }}
        >
          <Stack
            justify={`${matches ? "center" : "space-between"}`}
            p={16}
            py={32}
            h="100%"
            spacing="xl"
          >
            <Space />
            <Stack
              align="center"
              sx={{ zIndex: 1, marginBottom: `${matches ? "2rem" : 0}` }}
            >
              <Image
                src="https://ui-avatars.com/api/?background=9775FA&color=fff&name=fb"
                radius="100%"
                width={128}
                height={128}
              />

              <Text color="white" fz="xl" ta="center" fw="bold" w="80%">
                Media tracking made easy. Join the party today.
              </Text>
            </Stack>
            <Stack>
              {Object.values(providers).map((provider) => {
                switch (provider.name) {
                  case "Google":
                    return (
                      <GoogleButton
                        key={provider.name}
                        providerId={provider.id}
                        size="lg"
                        variant="outline"
                        iconSize="1.1rem"
                      >
                        Sign in with Google
                      </GoogleButton>
                    );
                  case "Discord":
                    return (
                      <DiscordButton
                        key={provider.name}
                        providerId={provider.id}
                        size="lg"
                        variant="outline"
                      >
                        Sign in with Discord
                      </DiscordButton>
                    );
                  default:
                    return (
                      <Button
                        key={provider.name}
                        onClick={() => signIn(provider.id)}
                        size="lg"
                        variant="outline"
                        color="gray"
                      >
                        Sign in with {provider.name}
                      </Button>
                    );
                }
              })}
            </Stack>
          </Stack>
        </Container>
      </BackgroundImage>
    </>
  );
}

SignIn.getLayout = function (page: React.ReactElement) {
  return page;
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  // If the user is already logged in, redirect.
  // Note: Make sure not to redirect to the same page
  // To avoid an infinite loop!
  if (session) {
    return { redirect: { destination: "/community" } };
  }

  const providers = await getProviders();

  return {
    props: { providers: providers ?? [] },
  };
}
