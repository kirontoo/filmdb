import { NextApiRequest, NextApiResponse } from "next";
import {
  APIError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/errors";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth].api";

export type ReturnPayload = {
  status: string;
  message?: string;
  data?: Record<string, any>;
};

export type APIHandler = Record<
  string,
  (req: NextApiRequest, res: NextApiResponse) => Promise<void>
>;

export function createHandler(handlers: APIHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const method = req.method!.toLowerCase();
    const session = await getServerSession(req, res, authOptions);

    // check handler supports HTTP method
    if (!handlers[method]) {
      res.setHeader(
        "Allow",
        Object.keys(handlers).map((k) => k.toUpperCase())
      );
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
      // route handler
      if (session) {
        await handlers[method](req, res);
      } else {
        throw new APIError("not authenticated", UnauthorizedError);
      }
    } catch (error) {
      console.error(error);
      if (error instanceof APIError) {
        const { type } = error;
        if (type === UnauthorizedError) {
          return res.status(403).send({
            status: "error",
            message: error.message,
          });
        } else if (type === ValidationError) {
          return res.status(400).send({
            status: "fail",
            message: error.message,
          });
        } else {
          return res.status(400).send({
            status: "fail",
            message: error.message,
          });
        }
      }

      if (typeof error === "string") {
        // custom application error
        const is404 = error.toLowerCase().endsWith("not found");
        const statusCode = is404 ? 404 : 400;
        return res.status(statusCode).json({ status: "fail", message: error });
      }

      // default to 500 server error
      return res.status(500).send({
        status: "error",
        message: error,
      });
    }
  };
}
