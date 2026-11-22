"use client";

import React, { useState } from "react";
import { PriceHistoryPoint } from "@/lib/priceApi";

interface PriceHistoryChartProps {
  dataPoints: PriceHistoryPoint[];
  currencySymbol: string;
}

export function PriceHistoryChart({
  dataPoints,
  currencySymbol,
}: PriceHistoryChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<PriceHistoryPoint | null>(null);

  if (!dataPoints || dataPoints.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-[#0c0e17] rounded-xl border border-[#202738] text-slate-500 text-xs">
        No price history recorded yet for this region.
      </div>
    );
  }

  // Dimensions
  const width = 700;
  const height = 260;
  const paddingX = 50;
  const paddingY = 40;

  const prices = dataPoints.map((d) => d.price);
  const minPrice = Math.min(...prices) * 0.95;
  const maxPrice = Math.max(...prices) * 1.05;
  const priceRange = maxPrice - minPrice || 1;

  // Generate SVG coordinates
  const points = dataPoints.map((d, index) => {
    const x =
      dataPoints.length === 1
        ? width / 2
        : paddingX + (index / (dataPoints.length - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - ((d.price - minPrice) / priceRange) * (height - 2 * paddingY);
    return { ...d, x, y };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  const areaD =
    points.length > 1
      ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${
          height - paddingY
        } Z`
      : "";

  return (
    <div className="relative bg-[#0c0e17] border border-[#202738] rounded-2xl p-4 sm:p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            Verified Price Tracking Timeline
          </h4>
          <p className="text-xs text-slate-400">
            Historical observed prices across authorized retailers and stores.
          </p>
        </div>

        {hoveredPoint && (
          <div className="bg-[#181c2b] border border-orange-500/40 px-3 py-1.5 rounded-lg text-xs font-mono">
            <span className="text-orange-400 font-bold">
              {currencySymbol}{hoveredPoint.price}
            </span>{" "}
            <span className="text-slate-400">
              ({new Date(hoveredPoint.observed_at).toLocaleDateString()})
            </span>
          </div>
        )}
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-56 sm:h-64"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="#1b2131"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={height / 2}
            x2={width - paddingX}
            y2={height / 2}
            stroke="#1b2131"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="#262f45"
          />

          {/* Area Fill */}
          {areaD && <path d={areaD} fill="url(#priceGradient)" />}

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#f97316"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((p, idx) => (
            <g
              key={idx}
              className="cursor-pointer group"
              onMouseEnter={() => setHoveredPoint(p)}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r="6"
                className="fill-orange-500 stroke-[#0c0e17] stroke-2 hover:r-8 transition-all"
              />
              <circle cx={p.x} cy={p.y} r="14" fill="transparent" />
            </g>
          ))}
        </svg>
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-[#1a2030] mt-2">
        <span>Start: {new Date(dataPoints[0].observed_at).toLocaleDateString()}</span>
        <span>Latest: {new Date(dataPoints[dataPoints.length - 1].observed_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
