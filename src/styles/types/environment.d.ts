namespace NodeJS {
  interface ProcessEnv extends NodeJS.ProcessEnv {
    AUTH0_CLIENT_ID: string
    AUTH0_CLIENT_SECRET: string
    AUTH0_ISSUER: string
    GOOGLE_CLIENT_ID: string
    GOOGLE_CLIENT_SECRET: string
    DISCORD_CLIENT_ID: string
    DISCORD_CLIENT_SECRET: string
    DATABASE_URL: string
    SECRET: string
  }
}
