/**
 * The six seeded training properties, with the analyst's Mid revenue forecast
 * from the assessment brief. The seed is identical on every run, so these
 * never change.
 */
export const PROPERTIES = {
  gatlinburg: {
    zpid: "41234567",
    street: "1240 Ski View Dr",
    price: 675_000,
    referenceMid: 125_000,
  },
  brokenBow: {
    zpid: "52345678",
    street: "88 Lakeshore Ln",
    price: 540_000,
    referenceMid: 96_000,
  },
  kissimmee: {
    zpid: "63456789",
    street: "3402 Palm Isle Ct",
    price: 895_000,
    referenceMid: 165_000,
  },
  blueRidge: {
    zpid: "74567890",
    street: "215 Aspen Ridge Rd",
    price: 725_000,
    referenceMid: 128_000,
  },
  portAransas: {
    zpid: "85678901",
    street: "9 Dune Walk",
    price: 1_150_000,
    referenceMid: 192_000,
  },
  sevierville: {
    zpid: "96789012",
    street: "47 Cedar Hollow Rd",
    price: 449_000,
    referenceMid: 80_000,
  },
} as const;

export type Property = (typeof PROPERTIES)[keyof typeof PROPERTIES];
