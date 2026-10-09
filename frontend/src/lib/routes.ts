/** Every in-app URL in one place, so links and tests can't drift apart. */
export const routes = {
  dashboard: () => "/",
  property: (zpid: string) => `/properties/${encodeURIComponent(zpid)}`,
  underwriting: (id: number) => `/underwritings/${id}`,
  submission: (id: number) => `/submissions/${id}`,
};
