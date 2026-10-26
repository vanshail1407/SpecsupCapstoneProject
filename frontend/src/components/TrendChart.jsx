import React, { useState } from 'react';

export default function TrendChart({ history }) {
  if (!history || history.length < 2) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-8 text-center">
        <p className="text-slate-600 text-sm font-medium">
          Add at least two checkups to generate a prescription trend graph.
        </p>
      </div>
    );
  }

  // Sort chronological for plotting (oldest to newest)
  const sorted = [...history].sort(
    (a, b) => new Date(a.checkup_date).getTime() - new Date(b.checkup_date).getTime()
  );

  // Determine min and max SPH to scale the Y axis
  const allSph = sorted.flatMap((d) => [Number(d.right_sph), Number(d.left_sph)]);
  let minSph = Math.min(...allSph);
  let maxSph = Math.max(...allSph);

  // Add padding to Y bounds
  minSph = Math.floor(minSph - 0.5);
  maxSph = Math.ceil(maxSph + 0.5);
  if (minSph === maxSph) {
    minSph -= 1;
    maxSph += 1;
  }

  // Chart dimensions in SVG coordinates
  const width = 640;
  const height = 280;
  const paddingLeft = 55;
  const paddingRight = 35;
  const paddingTop = 30;
  const paddingBottom = 45;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  // Coordinate scales
  const getX = (index) => paddingLeft + (index / (sorted.length - 1)) * chartW;
  const getY = (val) => paddingTop + ((maxSph - val) / (maxSph - minSph)) * chartH;

  // Generate polyline points
  const rightPoints = sorted.map((d, i) => `${getX(i)},${getY(Number(d.right_sph))}`).join(' ');
  const leftPoints = sorted.map((d, i) => `${getX(i)},${getY(Number(d.left_sph))}`).join(' ');

  // Y-axis tick values (e.g. every 0.5 D or 1.0 D)
  const yTicks = [];
  const step = (maxSph - minSph) > 4 ? 1.0 : 0.5;
  for (let y = minSph; y <= maxSph + 0.001; y += step) {
    yTicks.push(Number(y.toFixed(2)));
  }

  const [hoveredIdx, setHoveredIdx] = useState(null);

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-base font-semibold text-slate-900">Historical SPH Progression</h4>
          <p className="text-xs text-slate-600">Prescription power changes over time</p>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 text-xs font-semibold">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-sky-600 inline-block shadow-xs"></span>
            <span className="text-slate-700">Right Eye (OD)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-teal-500 inline-block shadow-xs"></span>
            <span className="text-slate-700">Left Eye (OS)</span>
          </div>
        </div>
      </div>

      {/* SVG Responsive Container */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[500px]"
          style={{ userSelect: 'none' }}
        >
          {/* Background Grid Lines & Y Ticks */}
          {yTicks.map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke={tick === 0 ? '#94A3B8' : '#F1F5F9'}
                  strokeWidth={tick === 0 ? '1.5' : '1'}
                  strokeDasharray={tick === 0 ? 'none' : '3,3'}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-mono"
                >
                  {tick > 0 ? `+${tick.toFixed(2)}` : tick.toFixed(2)} D
                </text>
              </g>
            );
          })}

          {/* X Axis Date Labels */}
          {sorted.map((d, i) => {
            const x = getX(i);
            return (
              <g key={d.id || i}>
                <line
                  x1={x}
                  y1={paddingTop}
                  x2={x}
                  y2={height - paddingBottom}
                  stroke="#F8FAFC"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={height - paddingBottom + 18}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-500 font-medium"
                >
                  {d.checkup_date}
                </text>
              </g>
            );
          })}

          {/* Lines */}
          {/* Right Eye (Sky Blue) */}
          <polyline
            fill="none"
            stroke="#0284C7"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={rightPoints}
          />

          {/* Left Eye (Teal) */}
          <polyline
            fill="none"
            stroke="#14B8A6"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={leftPoints}
          />

          {/* Interactive Data Dots */}
          {sorted.map((d, i) => {
            const x = getX(i);
            const yr = getY(Number(d.right_sph));
            const yl = getY(Number(d.left_sph));
            const isHovered = hoveredIdx === i;

            return (
              <g key={`dots-${i}`} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
                {/* Right Eye Dot */}
                <circle
                  cx={x}
                  cy={yr}
                  r={isHovered ? 6 : 4}
                  fill="#0284C7"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="transition-all duration-150 cursor-pointer"
                />
                {/* Value Label Above Dot */}
                <text
                  x={x}
                  y={yr - 8}
                  textAnchor="middle"
                  className="text-[9px] font-bold fill-sky-800 pointer-events-none"
                >
                  {Number(d.right_sph) > 0 ? `+${d.right_sph}` : d.right_sph}
                </text>

                {/* Left Eye Dot */}
                <circle
                  cx={x}
                  cy={yl}
                  r={isHovered ? 6 : 4}
                  fill="#14B8A6"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="transition-all duration-150 cursor-pointer"
                />
                {/* Value Label Below Dot */}
                <text
                  x={x}
                  y={yl + 14}
                  textAnchor="middle"
                  className="text-[9px] font-bold fill-teal-800 pointer-events-none"
                >
                  {Number(d.left_sph) > 0 ? `+${d.left_sph}` : d.left_sph}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
        <span>X-Axis: Examination Date</span>
        <span>Y-Axis: Spherical Diopters (D)</span>
      </div>
    </div>
  );
}
