import { OperatingExpenses, OptimizationList } from "./sections/line-items";
import { PurchaseFinancing } from "./sections/purchase-financing";
import { Taxes } from "./sections/taxes";

/** What the deal costs: purchase & financing, setup spend, running costs, taxes. */
export function FinancialsTab() {
  return (
    <div className="space-y-6">
      <PurchaseFinancing />
      <OptimizationList />
      <OperatingExpenses />
      <Taxes />
    </div>
  );
}
