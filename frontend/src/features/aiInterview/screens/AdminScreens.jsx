import { Button, MetricCard, ProgressLine, SectionCard } from "../components/shared";

export function AdminDashboardScreen({ onQuestionBank, onModelSettings }) {
  return (
    <div className="page-grid">
      <section className="metric-grid">
        <MetricCard label="Tổ chức đang hoạt động" value="230" delta="+12 trong tháng" tone="good" />
        <MetricCard label="Phiên AI mỗi ngày" value="4,182" delta="Cao điểm lúc 14:00 UTC" tone="default" />
        <MetricCard label="P95 phản hồi mô hình" value="1.9s" delta="Tối ưu -0.4s" tone="good" />
        <MetricCard label="Tuân thủ chính sách" value="99.4%" delta="Đã xử lý 2 cảnh báo" tone="good" />
      </section>

      <section className="two-col">
        <SectionCard title="Vận hành nền tảng" subtitle="Các điểm kiểm soát quản trị quan trọng">
          <ul className="clean-list">
            <li>98% prompt đang hoạt động vượt qua kiểm tra chất lượng câu hỏi.</li>
            <li>Bộ theo dõi thiên lệch phát hiện 2 mẫu diễn đạt mức độ thấp tuần này.</li>
            <li>Không có suy giảm dịch vụ ở các endpoint chấm điểm phỏng vấn.</li>
          </ul>
          <div className="inline-actions">
            <Button onClick={onQuestionBank}>Quản Lý Ngân Hàng Câu Hỏi</Button>
            <Button variant="ghost" onClick={onModelSettings}>
              Cấu Hình Mô Hình AI
            </Button>
          </div>
        </SectionCard>
        <SectionCard title="Sức khỏe hệ thống" subtitle="Telemetry dịch vụ theo thời gian thực">
          <div className="progress-stack">
            <ProgressLine label="Mức sử dụng cụm suy luận" value={68} />
            <ProgressLine label="Áp lực hàng đợi" value={22} />
            <ProgressLine label="Dung lượng rate-limit" value={77} />
            <ProgressLine label="Thông lượng đánh giá" value={91} />
          </div>
        </SectionCard>
      </section>
    </div>
  );
}

export function QuestionBankScreen({ category, setCategory, bank, onModelSettings }) {
  const rows = bank[category] || [];

  return (
    <div className="page-grid">
      <SectionCard title="Ngân hàng câu hỏi" subtitle="Quản trị câu hỏi phỏng vấn theo nhóm và độ khó">
        <div className="category-row">
          {Object.keys(bank).map((item) => (
            <button
              key={item}
              className={item === category ? "active" : ""}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="table">
          <div className="table-head">
            <span>Câu hỏi</span>
            <span>Độ khó</span>
            <span>Số lần dùng</span>
          </div>
          {rows.map((row) => (
            <div className="table-row" key={row.question}>
              <span>{row.question}</span>
              <span>{row.difficulty}</span>
              <span>{row.usage}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <section className="two-col">
        <SectionCard title="Hàng chờ biên tập" subtitle="Nội dung đang chờ duyệt">
          <div className="empty-state">
            <strong>Hiện không có chỉnh sửa chờ duyệt.</strong>
            <p>Hàng chờ chất lượng câu hỏi đang thông suốt.</p>
          </div>
        </SectionCard>
        <SectionCard title="Kiểm soát runtime AI" subtitle="Tinh chỉnh hành vi sau khi cập nhật nội dung">
          <p>Sau khi chỉnh sửa prompt phỏng vấn, hãy kiểm tra lại cấu hình mô hình để giữ độ ổn định chấm điểm.</p>
          <Button onClick={onModelSettings}>Mở Cài Đặt Mô Hình AI</Button>
        </SectionCard>
      </section>
    </div>
  );
}

export function AiModelSettingsScreen({ modelSettings, setModelSettings, onBackAdmin }) {
  return (
    <div className="page-grid">
      <SectionCard title="Cài đặt mô hình AI" subtitle="Kiểm soát production cho chất lượng phản hồi và chi phí">
        <div className="form-grid two">
          <label>
            Nhà cung cấp
            <select
              value={modelSettings.provider}
              onChange={(event) => setModelSettings({ ...modelSettings, provider: event.target.value })}
            >
              <option>OpenAI</option>
              <option>Azure OpenAI</option>
              <option>Anthropic</option>
            </select>
          </label>
          <label>
            Mô hình
            <input
              value={modelSettings.model}
              onChange={(event) => setModelSettings({ ...modelSettings, model: event.target.value })}
            />
          </label>
          <label>
            Nhiệt độ: {modelSettings.temperature}
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={modelSettings.temperature}
              onChange={(event) =>
                setModelSettings({ ...modelSettings, temperature: Number(event.target.value) })
              }
            />
          </label>
          <label>
            Max Tokens
            <input
              type="number"
              value={modelSettings.maxTokens}
              onChange={(event) => setModelSettings({ ...modelSettings, maxTokens: Number(event.target.value) })}
            />
          </label>
          <label>
            Ngưỡng an toàn: {modelSettings.safetyThreshold}
            <input
              type="range"
              min="60"
              max="100"
              value={modelSettings.safetyThreshold}
              onChange={(event) =>
                setModelSettings({ ...modelSettings, safetyThreshold: Number(event.target.value) })
              }
            />
          </label>
          <label>
            Thời gian lưu transcript
            <select
              value={modelSettings.transcriptRetention}
              onChange={(event) =>
                setModelSettings({ ...modelSettings, transcriptRetention: event.target.value })
              }
            >
              <option>30 ngày</option>
              <option>90 ngày</option>
              <option>180 ngày</option>
            </select>
          </label>
        </div>
        <label className="inline-check">
          <input
            type="checkbox"
            checked={modelSettings.realtimeVoice}
            onChange={(event) => setModelSettings({ ...modelSettings, realtimeVoice: event.target.checked })}
          />
          Bật suy luận giọng nói thời gian thực độ trễ thấp
        </label>
        <div className="inline-actions">
          <Button variant="ghost" onClick={onBackAdmin}>
            Quay Lại Bảng Quản Trị
          </Button>
          <Button>Lưu Cấu Hình Mô Hình</Button>
        </div>
      </SectionCard>

      <section className="metric-grid">
        <MetricCard label="Chi phí dự kiến theo tháng" value="$14,280" delta="-8% sau tối ưu cache" tone="good" />
        <MetricCard label="Độ trễ trung bình kỳ vọng" value="1.8s" delta="cho các lệnh chấm điểm phỏng vấn" tone="default" />
        <MetricCard label="Trạng thái mô hình dự phòng" value="Ổn định" delta="0 sự cố trong 30 ngày" tone="good" />
        <MetricCard label="Tỷ lệ cache prompt hit" value="61%" delta="+9% so với kỳ trước" tone="good" />
      </section>
    </div>
  );
}
