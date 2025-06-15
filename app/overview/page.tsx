import { Suspense } from "react";
import ClientOverview from "./ClientOverview";

export default function Overview() {
  return (
    <Suspense fallback={null}>
      <ClientOverview />
    </Suspense>
  );
}
