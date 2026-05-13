import { Button, MetricCard, SectionCard } from "../components/shared";

export function HrDashboardScreen({ onCompare, onCandidateJourney }) {
  return (
    <div className="page-grid">
      <section className="metric-grid">
        <MetricCard label="Số JD đang mở" value="14" delta="3 JD mới tuần này" tone="default" />
        <MetricCard label="Ứng viên đã sàng lọc" value="326" delta="+29 trong 7 ngày" tone="good" />
        <MetricCard label="Điểm chất lượng phỏng vấn TB" value="87/100" delta="Ổn định và tăng dần" tone="good" />
        <MetricCard label="Thời gian vào shortlist" value="2.4 ngày" delta="Cải thiện -0.7 ngày" tone="good" />
      </section>

      <section className="two-col">
        <SectionCard title="Hiệu suất theo JD" subtitle="Chất lượng tín hiệu cho từng vai trò đang tuyển">
          <div className="table">
            <div className="table-head">
              <span>Vị trí</span>
              <span>Ứng viên</span>
              <span>Khớp TB</span>
              <span>Sức khỏe top funnel</span>
            </div>
            {[
              ["Kỹ sư Backend cấp cao", "62", "89%", "Tốt"],
              ["Nhà thiết kế sản phẩm", "41", "86%", "Tốt"],
              ["Chuyên viên phân tích dữ liệu", "53", "81%", "Trung bình"],
            ].map((row) => (
              <div className="table-row" key={row[0]}>
                <span>{row[0]}</span>
                <span>{row[1]}</span>
                <span>{row[2]}</span>
                <span>{row[3]}</span>
              </div>
            ))}
          </div>
          <div className="inline-actions">
            <Button onClick={onCompare}>So Sánh Ứng Viên</Button>
            <Button variant="ghost" onClick={onCandidateJourney}>
              Đăng Nhập Tài Khoản Ứng Viên
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="Phân bổ pipeline" subtitle="Phễu nhân tài thời gian thực">
          <div className="funnel">
            <div style={{ "--w": "100%" }}>
              <span>Đã nộp hồ sơ</span>
              <strong>1,204</strong>
            </div>
            <div style={{ "--w": "72%" }}>
              <span>Đã sàng lọc AI</span>
              <strong>867</strong>
            </div>
            <div style={{ "--w": "46%" }}>
              <span>Đủ điều kiện phỏng vấn</span>
              <strong>554</strong>
            </div>
            <div style={{ "--w": "28%" }}>
              <span>Vòng cuối</span>
              <strong>337</strong>
            </div>
          </div>
        </SectionCard>
      </section>
    </div>
  );
}

export function CandidateComparisonScreen({ search, setSearch, rows, onAdmin }) {
  return (
    <div className="page-grid">
      <SectionCard title="So sánh ứng viên" subtitle="Xếp hạng song song cho vị trí Kỹ sư Backend cấp cao">
        <label className="search-input">
          Tìm ứng viên
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tên, vị trí hoặc mức rủi ro"
          />
        </label>

        {rows.length === 0 ? (
          <div className="empty-state">
            <strong>Không có ứng viên phù hợp từ khóa tìm kiếm.</strong>
            <p>Hãy thử từ khóa khác để tiếp tục so sánh.</p>
          </div>
        ) : (
          <div className="table">
            <div className="table-head">
              <span>Ứng viên</span>
              <span>Khớp JD</span>
              <span>Điểm phỏng vấn</span>
              <span>Giao tiếp</span>
              <span>Độ ổn định</span>
              <span>Rủi ro</span>
            </div>
            {rows.map((row) => (
              <div className="table-row" key={row.name}>
                <span>{row.name}</span>
                <span>{row.match}%</span>
                <span>{row.interview}</span>
                <span>{row.communication}</span>
                <span>{row.consistency}</span>
                <span>{row.risk}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <section className="two-col">
        <SectionCard title="Ứng viên nổi bật nhất" subtitle="Tự động đề xuất theo mô hình trọng số tuyển dụng">
          <h4>Elena Wang</h4>
          <ul className="clean-list">
            <li>Độ ổn định tổng thể cao nhất và hồ sơ rủi ro thấp.</li>
            <li>Chiều sâu kỹ thuật tốt, giao tiếp rõ ràng trong áp lực.</li>
            <li>Khuyến nghị chuyển thẳng sang vòng panel cuối.</li>
          </ul>
        </SectionCard>
        <SectionCard title="Không gian tiếp theo" subtitle="Tiếp tục sang khu vực kiểm soát toàn cục">
          <p>Chuyển sang không gian Quản trị để quản lý ngân hàng câu hỏi và tinh chỉnh mô hình.</p>
          <Button onClick={onAdmin}>Đăng Nhập Tài Khoản Quản Trị</Button>
        </SectionCard>
      </section>
    </div>
  );
}
