import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { ZodError } from "zod";
import { authOptions } from "./auth";
export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
type Handler = (req: NextApiRequest, res: NextApiResponse, userId: string) => Promise<void>;
export function gameApi(methods: string[], handler: Handler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    res.setHeader("Cache-Control", "private, no-store");
    if (!methods.includes(req.method ?? "")) { res.setHeader("Allow", methods); res.status(405).json({ error: "Method not allowed" }); return; }
    try {
      const session = await getServerSession(req, res, authOptions);
      if (!session?.user?.id) throw new ApiError(401, "Authentication required");
      if (req.method !== "GET") {
        const origin = req.headers.origin;
        const expected = process.env.NEXTAUTH_URL;
        if (req.headers["sec-fetch-site"] === "cross-site" || (origin && (!expected || origin !== new URL(expected).origin))) throw new ApiError(403, "Invalid origin");
        if (req.method !== "DELETE" && !req.headers["content-type"]?.startsWith("application/json")) throw new ApiError(415, "JSON required");
      }
      await handler(req, res, session.user.id);
    } catch (error) {
      if (error instanceof ApiError) { res.status(error.status).json({ error: error.message }); return; }
      if (error instanceof ZodError) { res.status(400).json({ error: "Invalid input", issues: error.issues }); return; }
      const e = error as { code?: string; cause?: { code?: string } };
      if (e?.code === "23505" || e?.cause?.code === "23505") { res.status(409).json({ error: "Record already exists" }); return; }
      console.error("Game API request failed", req.method);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}
