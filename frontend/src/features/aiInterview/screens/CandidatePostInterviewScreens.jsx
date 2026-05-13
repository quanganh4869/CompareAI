import { PROGRESS_LINE } from "../data/mockData";
import { Button, MetricCard, Pill, ProgressLine, SectionCard } from "../components/shared";

export function ResultSummaryScreen({ onDetails, onRetry }) {
  return (
    <div className="page-grid">
      <section className="metric-grid">
        <MetricCard label="Điểm tổng" value="88/100" delta="Top 9% cho vị trí này" tone="good" />
        <MetricCard label="Giao tiếp" value="90/100" delta="Trả lời có cấu trúc cao" tone="good" />
        <MetricCard label="Giải quyết vấn đề" value="84/100" delta="Chiều sâu lập luận tốt" tone="default" />
        <MetricCard label="Mức khớp vai trò" value="91%" delta="Hồ sơ bám sát JD" tone="good" />
      </section>

      <section className="two-col">
        <SectionCard title="Chi tiết theo năng lực" subtitle="Hiệu suất theo từng tín hiệu tuyển dụng">
          <div className="progress-stack">
            <ProgressLine label="Năng lực lãnh đạo" value={86} />
            <ProgressLine label="Độ rõ ràng triển khai" value={89} />
            <ProgressLine label="Tư duy chiến lược" value={84} />
            <ProgressLine label="Năng lực dữ liệu" value={81} />
            <ProgressLine label="Sự hiện diện trong giao tiếp" value={92} />
          </div>
        </SectionCard>
        <SectionCard title="Nhận định tổng quan" subtitle="Điểm nổi bật do AI tổng hợp">
          <ul className="clean-list">
            <li>Khả năng framing tốt và giao tiếp súc tích dưới áp lực.</li>
            <li>Đồng cảm stakeholder rõ ràng, tư duy liên phòng ban tốt.</li>
            <li>Điểm cần cải thiện: mô tả sâu hơn phương pháp thử nghiệm.</li>
            <li>Điểm cần cải thiện: đưa chỉ số tác động sớm hơn trong câu trả lời.</li>
          </ul>
          <div className="inline-actions">
            <Button onClick={onDetails}>Xem Phản Hồi Chi Tiết</Button>
            <Button variant="soft" onClick={onRetry}>
              Bắt Đầu Phiên Mới
            </Button>
          </div>
        </SectionCard>
      </section>
    </div>
  );
}

export function DetailedFeedbackScreen({ onHistory, onRetry }) {
  return (
    <div className="page-grid">
      <SectionCard title="Phân tích transcript" subtitle="Chất lượng theo từng lượt và gợi ý cải thiện">
        <div className="table">
          <div className="table-head">
            <span>Nhóm câu hỏi</span>
            <span>Điểm</span>
            <span>Điểm mạnh</span>
            <span>Cần cải thiện</span>
          </div>
          {[
            {
              area: "Đánh đổi kiến trúc",
              score: "8.9",
              strength: "Cân bằng tốt giữa tốc độ và khả năng mở rộng.",
              improve: "Nêu thêm một chỉ số gắn với quyết định.",
            },
            {
              area: "Kiểm soát suy giảm hiệu năng",
              score: "8.4",
              strength: "Quy trình và tinh thần ownership tốt.",
              improve: "Bổ sung ngưỡng cảnh báo cụ thể.",
            },
            {
              area: "Xử lý xung đột stakeholder",
              score: "9.1",
              strength: "Cấu trúc giao tiếp rõ ràng và có đồng cảm.",
              improve: "Định lượng tác động kinh doanh sau khi giải quyết.",
            },
          ].map((row) => (
            <div className="table-row" key={row.area}>
              <span>{row.area}</span>
              <span>{row.score}</span>
              <span>{row.strength}</span>
              <span>{row.improve}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <section className="two-col">
        <SectionCard title="Kế hoạch coaching cá nhân" subtitle="7 ngày tiếp theo">
          <ul className="clean-list">
            <li>Chạy 2 phiên giọng nói tập trung vào phối hợp stakeholder enterprise.</li>
            <li>Luyện 5 câu chuyện STAR với mở đầu có định lượng tác động.</li>
            <li>Chuẩn bị 1 câu trả lời tình huống có kết quả thử nghiệm đo lường được.</li>
          </ul>
        </SectionCard>
        <SectionCard title="Tài nguyên gợi ý" subtitle="Tự động cá nhân hóa theo điểm yếu">
          <div className="chip-row">
            <Pill tone="info">Mẫu cấu trúc câu trả lời</Pill>
            <Pill tone="info">Cẩm nang kể chuyện lãnh đạo</Pill>
            <Pill tone="info">Cheatsheet ngôn ngữ chỉ số</Pill>
            <Pill tone="info">Prompt giao tiếp đánh đổi</Pill>
          </div>
          <div className="inline-actions">
            <Button onClick={onRetry}>Luyện Lại</Button>
            <Button variant="ghost" onClick={onHistory}>
              Mở Lịch Sử Phỏng Vấn
            </Button>
          </div>
        </SectionCard>
      </section>
    </div>
  );
}

export function HistoryScreen({ historyFilter, setHistoryFilter, rows, onAnalytics }) {
  return (
    <div className="page-grid">
      <SectionCard
        title="Lịch sử phỏng vấn"
        subtitle="Theo dõi toàn bộ phiên mô phỏng và tiến độ theo thời gian"
        action={
          <select value={historyFilter} onChange={(event) => setHistoryFilter(event.target.value)}>
            <option value="all">Tất cả</option>
            <option value="technical">Kỹ thuật</option>
            <option value="behavioral">Hành vi</option>
            <option value="case">Tình huống</option>
          </select>
        }
      >
        {rows.length === 0 ? (
          <div className="empty-state">
            <strong>Không có phiên nào cho bộ lọc này.</strong>
            <p>Hãy thử danh mục khác hoặc chạy phiên mock mới để tạo dữ liệu.</p>
          </div>
        ) : (
          <div className="table">
            <div className="table-head">
              <span>Mã phiên</span>
              <span>Ngày</span>
              <span>Vị trí</span>
              <span>Chế độ</span>
              <span>Điểm</span>
              <span>Tín hiệu quyết định</span>
            </div>
            {rows.map((row) => (
              <div className="table-row" key={row.id}>
                <span>{row.id}</span>
                <span>{row.date}</span>
                <span>{row.role}</span>
                <span>{row.mode}</span>
                <span>{row.score}</span>
                <span>{row.verdict}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
      <Button onClick={onAnalytics}>Mở Phân Tích Tiến Độ</Button>
    </div>
  );
}

export function AnalyticsScreen({ onHr }) {
  const points = PROGRESS_LINE.map((value, index) => `${index * 60 + 20},${120 - value}`).join(" ");

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <MetricCard label="Cải thiện 30 ngày" value="+14%" delta="Nhanh hơn nhóm benchmark" tone="good" />
        <MetricCard label="Kỹ năng cải thiện mạnh nhất" value="Giao tiếp với stakeholder" delta="+19 điểm" tone="good" />
        <MetricCard label="Biến động độ tự tin" value="-11%" delta="Câu trả lời ổn định hơn" tone="good" />
        <MetricCard label="Số phiên khuyến nghị" value="2 phiên tuần này" delta="Để đạt mốc 90+" tone="default" />
      </section>

      <section className="two-col">
        <SectionCard title="Đường xu hướng điểm số" subtitle="Biến động điểm qua 8 lần phỏng vấn">
          <svg className="line-chart" viewBox="0 0 460 140" role="img" aria-label="Biểu đồ xu hướng điểm số">
            <polyline points={points} />
          </svg>
          <div className="line-legend">
            <span />
            Xu hướng điểm phỏng vấn
          </div>
        </SectionCard>
        <SectionCard title="Mức phủ năng lực" subtitle="Mức tự tin hiện tại theo từng chiều kỹ năng">
          <div className="progress-stack">
            <ProgressLine label="Tư duy thiết kế hệ thống" value={86} />
            <ProgressLine label="Kể chuyện bằng dữ liệu" value={79} />
            <ProgressLine label="Năng lực lãnh đạo" value={90} />
            <ProgressLine label="Độ rõ ràng ưu tiên" value={83} />
          </div>
        </SectionCard>
      </section>

      <Button variant="soft" onClick={onHr}>
        Đăng Nhập Tài Khoản Tuyển Dụng
      </Button>
    </div>
  );
}
