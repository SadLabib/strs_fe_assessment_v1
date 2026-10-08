import { expect, type APIRequestContext } from "@playwright/test";

import { API_URL } from "../support/backend";
import type { Property } from "./properties";

/**
 * A complete, valid underwriting body (the API's format: fractions and
 * decimal strings). Low and High sit around Mid so Low ≤ Mid ≤ High holds.
 */
export function completePayload(property: Property, mid: number) {
  return {
    purchase_details: {
      purchase_price: String(property.price),
      down_payment_pct: "0.2",
      interest_rate: "0.07",
      mortgage_years: 30,
      closing_costs_pct: "0.03",
    },
    forecasted_revenue: {
      co_hosting_fee_pct: "0",
      annual_re_appreciation_pct: "0.03",
      scenarios: {
        low: { forecasted_revenue: String(Math.round(mid * 0.85)) },
        mid: { forecasted_revenue: String(mid) },
        high: { forecasted_revenue: String(Math.round(mid * 1.15)) },
      },
    },
    taxes: {
      land_assumptions_pct: "0.2",
      sla_multiplier_pct: "0.25",
      bonus_amount_pct: "0.6",
      tax_rate_pct: "0.37",
    },
    optimization_items: [{ category: "Furniture", total_price: "40000" }],
    operating_expenses: [{ expense_name: "Utilities", monthly_amount: "450" }],
  };
}

/**
 * Arranges test data straight through the API (fast and exact), so each test
 * spends its time on the UI behaviour it's actually about.
 */
export class TrainingApi {
  constructor(private readonly request: APIRequestContext) {}

  async createDraft(property: Property): Promise<number> {
    const response = await this.request.post(`${API_URL}/api/underwritings`, {
      data: { zpid: property.zpid },
    });
    expect(response.status()).toBe(201);
    return (await response.json()).id;
  }

  /** A draft with every section complete and the given Mid forecast. */
  async completeDraft(property: Property, mid: number): Promise<number> {
    const id = await this.createDraft(property);
    const response = await this.request.put(
      `${API_URL}/api/underwritings/${id}`,
      {
        data: completePayload(property, mid),
      },
    );
    expect(response.ok()).toBe(true);
    return id;
  }

  /** Grades a draft directly, for tests that only need earlier attempts to exist. */
  async submit(property: Property, mid: number): Promise<number> {
    const id = await this.completeDraft(property, mid);
    const response = await this.request.post(
      `${API_URL}/api/underwritings/${id}/submit`,
    );
    expect(response.ok()).toBe(true);
    return (await response.json()).submission.id;
  }

  async underwritingExists(id: number) {
    return (await this.request.get(`${API_URL}/api/underwritings/${id}`)).ok();
  }

  /** The analyst's answer key for a property: the app must never show it. */
  async referenceId(property: Property): Promise<number> {
    // The seed creates the six references first, so they have the lowest ids.
    for (let id = 1; id <= 20; id++) {
      const response = await this.request.get(
        `${API_URL}/api/underwritings/${id}`,
      );
      if (!response.ok()) continue;
      const underwriting = await response.json();
      if (underwriting.is_reference && underwriting.zpid === property.zpid)
        return id;
    }
    throw new Error(`No reference underwriting found for ${property.zpid}`);
  }

  async dashboardRow(property: Property) {
    const response = await this.request.get(`${API_URL}/api/dashboard`);
    expect(response.ok()).toBe(true);
    const { properties } = await response.json();
    return properties.find(
      (row: { zpid: string }) => row.zpid === property.zpid,
    );
  }
}
