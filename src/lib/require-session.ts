import type { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";

export const requireSession: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  context.res.setHeader("Cache-Control", "private, no-store");
  if (!session?.user?.id) {
    return { redirect: { destination: "/api/auth/signin?callbackUrl=" + encodeURIComponent(context.resolvedUrl), permanent: false } };
  }
  return { props: { session } };
};
