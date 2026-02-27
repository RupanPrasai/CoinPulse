import mongoose from "mongoose";

export type CoinMetricDoc = {
  coinId: string;
  vsCurrency: string;
  windowPoints: number;

  latestPrice: number;
  movingAverage: number;
  pctChange: number;
  volatility: number;

  sampleCount: number;
  computedAt: Date;
};

const CoinMetricSchema = new mongoose.Schema<CoinMetricDoc>(
  {
    coinId: { type: String, required: true, index: true },
    vsCurrency: { type: String, required: true },
    windowPoints: { type: Number, required: true },

    latestPrice: { type: Number, required: true },
    movingAverage: { type: Number, required: true },
    pctChange: { type: Number, required: true },
    volatility: { type: Number, required: true },

    sampleCount: { type: Number, required: true },
    computedAt: { type: Date, required: true, default: () => new Date(), index: true },
  },
  { timestamps: true }
);

CoinMetricSchema.index({ coinId: 1, vsCurrency: 1, windowPoints: 1 }, { unique: true });

export const CoinMetric =
  mongoose.models.CoinMetric || mongoose.model<CoinMetricDoc>("CoinMetric", CoinMetricSchema);
