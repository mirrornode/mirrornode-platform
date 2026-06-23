import { notFound } from "next/navigation";
import MatchmakerPrototype from "./MatchmakerPrototype";

export const dynamic = "force-dynamic";

export default function InternalMatchmakerPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <MatchmakerPrototype />;
}
