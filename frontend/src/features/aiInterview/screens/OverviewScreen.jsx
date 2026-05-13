import React, { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { MetricCard, SectionCard, Pill, Button } from "../components/shared";
import { useUser } from "../../UserContext";

function OverviewInsightCharts() {
  const trendDates = ["06/02", "13/02", "20/02", "27/02", "05/03", "12/03", "19/03", "26/03"];
  const trendScores = [64, 68, 70, 74, 78, 82, 85, 88];
  const radarAxes = [
    { label: "Logic", value: 78 },
    { label: "Tự tin", value: 84 },
    { label: "Chuyên môn", value: 81 },
    { label: "Tình huống", value: 69 },
    { label: "Giao tiếp", value: 74 },
  ];

  const chart = useMemo(() => {
    const width = 560;
    const height = 220;
    const pad = { left: 52, right: 18, top: 18, bottom: 38 };
    const n = trendScores.length;
    const stepX = n > 1 ? (width - pad.left - pad.right) / (n - 1) : 0;

    const pts = trendScores.map((value, idx) => {
      const safe = Math.max(0, Math.min(100, Number(value) || 0));
      const x = pad.left + idx * stepX;
      const y = pad.top + (1 - safe / 100) * (height - pad.top - pad.bottom);
      return { x, y, value: safe };
    });

    const linePath = pts
      .map((point, idx) => `${idx === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");
    const baseY = height - pad.bottom;
    const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${baseY} L ${pts[0].x} ${baseY} Z`;

    return { width, height, pad, pts, linePath, areaPath };
  }, []);

  const radarChart = useMemo(() => {
    const width = 360;
    const height = 300;
    const cx = width / 2;
    const cy = height / 2 + 6;
    const radius = 110;
    const count = radarAxes.length;
    const angleAt = (idx) => (-Math.PI / 2) + (idx * 2 * Math.PI) / count;

    const pointAt = (idx, ratio) => {
      const angle = angleAt(idx);
      const r = radius * ratio;
      return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
    };

    const rings = [0.2, 0.4, 0.6, 0.8, 1].map((ratio) =>
      radarAxes.map((_, idx) => {
        const p = pointAt(idx, ratio);
        return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
      }).join(" "),
    );

    const vertices = radarAxes.map((axis, idx) => {
      const ratio = Math.max(0, Math.min(1, (Number(axis.value) || 0) / 100));
      const point = pointAt(idx, ratio);
      const labelPoint = pointAt(idx, 1.14);
      return {
        axis,
        x: point.x,
        y: point.y,
        lx: labelPoint.x,
        ly: labelPoint.y,
        ax: pointAt(idx, 1).x,
        ay: pointAt(idx, 1).y,
      };
    });

    const polygon = vertices.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
    return { width, height, cx, cy, rings, vertices, polygon };
  }, []);

  return (
    <div className="section-card mt-4 p-4">
      <div className="section-card-head">
        <div>
          <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Tổng quan năng lực AI</h3>
          <p className="text-sm" style={{ color: 'var(--text-soft)' }}>Biểu đồ xu hướng và bản đồ năng lực.</p>
        </div>
      </div>
      <section className="report-two-col mt-4 grid gap-6 lg:grid-cols-2">
        <SectionCard title="Xu hướng điểm" subtitle="Phỏng vấn theo thời gian">
          <div className="trend-wrap overflow-x-auto">
            <svg className="trend-chart" viewBox={`0 0 ${chart.width} ${chart.height}`} width="100%">
              <defs>
                <linearGradient id="overviewTrendFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="rgba(37,99,235,0.2)" />
                  <stop offset="100%" stopColor="rgba(37,99,235,0)" />
                </linearGradient>
              </defs>

              {[0, 25, 50, 75, 100].map((tick) => {
                const y = chart.pad.top + (1 - tick / 100) * (chart.height - chart.pad.top - chart.pad.bottom);
                return (
                  <g key={tick}>
                    <line x1={chart.pad.left} x2={chart.width - chart.pad.right} y1={y} y2={y} style={{ stroke: 'var(--border)' }} strokeDasharray="4 4" />
                    <text x={chart.pad.left - 10} y={y + 4} textAnchor="end" fontSize="10" style={{ fill: 'var(--text-soft)' }}>
                      {tick}
                    </text>
                  </g>
                );
              })}

              <path d={chart.areaPath} fill="url(#overviewTrendFill)" />
              <path d={chart.linePath} fill="none" stroke="#2563eb" strokeWidth="2" />

              {chart.pts.map((point, idx) => (
                <circle key={idx} cx={point.x} cy={point.y} r="4" fill="#2563eb" />
              ))}

              {trendDates.map((label, idx) => (
                <text key={label} x={chart.pts[idx].x} y={chart.height - 10} textAnchor="middle" fontSize="10" fill="#94a3b8">
                  {label}
                </text>
              ))}
            </svg>
          </div>
        </SectionCard>

        <SectionCard title="Bản đồ năng lực" subtitle="Phân tích chi tiết">
          <div className="radar-wrap flex justify-center">
            <svg className="radar-chart" width={radarChart.width} height={radarChart.height}>
              {radarChart.rings.map((points, idx) => (
                <polygon key={idx} points={points} fill="none" style={{ stroke: 'var(--border)' }} />
              ))}
              {radarChart.vertices.map((point) => (
                <line key={point.axis.label} x1={radarChart.cx} y1={radarChart.cy} x2={point.ax} y2={point.ay} style={{ stroke: 'var(--border)' }} />
              ))}
              <polygon points={radarChart.polygon} fill="rgba(37,99,235,0.15)" stroke="#2563eb" strokeWidth="2" />
              {radarChart.vertices.map((point) => (
                <text key={`${point.axis.label}-label`} x={point.lx} y={point.ly} textAnchor="middle" fontSize="10" style={{ fill: 'var(--text-soft)' }}>
                  {point.axis.label}
                </text>
              ))}
            </svg>
          </div>
        </SectionCard>
      </section>
    </div>
  );
}

export function OverviewScreen({ onStartInterview, onOpenReports }) {
  const { user } = useUser();
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Chào mừng trở lại, {user?.name || "Người dùng"}!</h2>
          <p style={{ color: 'var(--text-soft)' }}>Dưới đây là tóm tắt tiến trình luyện tập của bạn.</p>
        </div>
        <Button variant="primary" onClick={onStartInterview}>
          Bắt đầu phỏng vấn mới
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Phiên luyện tập" value="12 phiên" delta="Đã hoàn thành" tone="good" />
        <MetricCard label="Điểm AI trung bình" value="7.5/10" delta="Đang cải thiện" tone="good" />
        <MetricCard label="Độ tương thích CV" value="78%" delta="Average Match" tone="default" />
        <MetricCard label="Hồ sơ đã gửi" value="2 đơn" delta="Official record" tone="default" />
      </div>

      <OverviewInsightCharts />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard title="Gợi ý luyện tập" subtitle="Các trọng tâm cần cải thiện">
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm" style={{ color: 'var(--text)' }}>
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                Ôn lại cấu trúc STAR cho nhóm câu hỏi hành vi.
              </li>
              <li className="flex items-start gap-3 text-sm" style={{ color: 'var(--text)' }}>
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                Rà soát 3 ví dụ định lượng kết quả công việc gần nhất.
              </li>
              <li className="flex items-start gap-3 text-sm" style={{ color: 'var(--text)' }}>
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                Luyện phản xạ trả lời câu hỏi tình huống 60-90 giây.
              </li>
            </ul>
            <div className="mt-6 flex gap-2">
              <Pill tone="success">Kỹ năng giao tiếp</Pill>
              <Pill tone="info">+0.4 điểm AI</Pill>
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white shadow-lg">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles size={20} />
              <h3 className="font-bold">Giả lập thực tế</h3>
            </div>
            <p className="mb-6 text-sm text-blue-100">
              Thực hành trả lời với AI, nhận phản hồi chi tiết và cải thiện trước khi vào phỏng vấn thật.
            </p>
            <button
              onClick={onStartInterview}
              className="w-full rounded-xl bg-white py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-50"
            >
              Luyện tập ngay
            </button>
          </div>
          
          <Button variant="secondary" className="w-full" onClick={onOpenReports}>
            Xem lịch sử phỏng vấn
          </Button>
        </aside>
      </div>
    </div>
  );
}
