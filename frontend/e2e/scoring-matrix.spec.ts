import { bandCases, boundaryCases } from "./fixtures/cases";
import { PROPERTIES } from "./fixtures/properties";
import { test } from "./fixtures/test";
import { usd } from "./support/expected";

// Every property gets one case per band (equivalence partitioning); two
// properties with different reference values also get every band edge,
// exactly on it and $1 past it (boundary values).
const cases = [
  ...Object.values(PROPERTIES).flatMap(bandCases),
  ...boundaryCases(PROPERTIES.gatlinburg),
  ...boundaryCases(PROPERTIES.portAransas),
];

test.describe("scoring matrix", () => {
  for (const scoringCase of cases) {
    const { property, label, mid, band } = scoringCase;

    test(`${property.street}: Mid ${usd(mid)} (${label}) scores ${band}`, async ({
      api,
      workspace,
      results,
    }) => {
      // Arrange through the API; act and assert through the UI.
      const id = await api.completeDraft(property, mid);
      await workspace.goto(id);
      await workspace.openReview();
      await workspace.submit();

      await results.waitForLoad();
      await results.expectGrade(scoringCase);
    });
  }
});
