import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STEPS = [
  {
    title: "What it costs up front",
    detail:
      "Down payment, closing costs and setup spend add up to the Total Out of Pocket.",
  },
  {
    title: "What it earns each year",
    detail:
      "Revenue minus running costs and the mortgage gives the Annual Free Cash Flow.",
  },
  {
    title: "How good the return is",
    detail:
      "Free cash flow divided by the cash put in gives the Cash-on-Cash return.",
  },
];

export function HowItWorks() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>How this works</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="space-y-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span
                aria-hidden
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
              >
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="rounded-lg border border-cta/40 bg-cta/10 p-3 text-sm">
          <p className="font-medium">
            You&apos;re graded on your Mid revenue forecast.
          </p>
          <p className="text-muted-foreground">
            Within 10% of the analyst&apos;s forecast scores 100, within 25%
            scores 70, and anything further scores 40.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
