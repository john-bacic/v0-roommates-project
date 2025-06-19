import { Suspense } from "react";
import ClientOverview from "@/app/overview/ClientOverview";

export default function Overview() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientOverview />
    </Suspense>
  );
}
