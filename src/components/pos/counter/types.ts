"use client";

import type { OrderItemOption } from "@/lib/store";

/**
 * One line on the LOCAL counter sale (NOT the shop cart). Each pick of a
 * product+option-combo is its own line so two different customisations of the
 * same drink can coexist. `lineId` is a stable client key for React + edits.
 */
export interface CounterSaleLine {
  lineId: string;
  productId: string;
  name: string;
  sku: string;
  image: string;
  qty: number;
  /** Max sellable units for this product (its current stock). */
  stock: number;
  /** Chosen option choices (label + priceDelta), e.g. [{label:"L",priceDelta:20}]. */
  options: OrderItemOption[];
  /** Base price for this customer (tier/custom) BEFORE option deltas. */
  basePrice: number;
  /** basePrice + sum(option.priceDelta). The actual unit price charged. */
  unitPrice: number;
}
