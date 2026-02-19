import { Schema, model } from "mongoose";

type PriceSnapshotDoc = {
  coindId: string;
  vsCurrency: string;
  price: number;
  collectedAt: Date;
  source: "coingecko";
};

const priceSnapshotSchema = new Schema<PriceSnapshotDoc>(
  {
    coindId: { type: String, required: true, index: true },
    vsCurrency: { type: String, required: true },
    price: { type: Number, required: true },
    collectedAt: { type: Date, required: true, index: true },
    source: { type: String, required: true, enum: ["coingecko"] },
  },
  { versionKey: false }
);

priceSnapshotSchema.index({ coinId: 1, collectedAt: -1 });

export const PriceSnapshot = model<PriceSnapshotDoc>(
  "PriceSnapshot",
  priceSnapshotSchema
);
