import { Returns } from "./sections/returns";
import { Revenue } from "./sections/revenue";

/** What the deal earns: revenue scenarios and the calculated returns. */
export function AnalysisTab() {
  return (
    <div className="space-y-6">
      <Revenue />
      <Returns />
    </div>
  );
}
