import { useState } from "react";
import {
  ArrowLeft,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Lightbulb,
  Map,
  Mic,
  MicOff,
  PhoneOff,
  Video,
  VideoOff,
} from "lucide-react";
import { INTERVIEW_QUESTIONS, PARSE_STAGES, READINESS_BARS } from "../data/mockData";
import { Button, MetricCard, Pill, ProgressLine, SectionCard } from "../components/shared";
import { formatTime } from "../utils/formatters";

export function CandidateDashboardScreen({ onStartJourney, onHistory, onAnalytics }) {
  return (
    <div className="page-grid">
      <section className="metric-grid">
        <MetricCard label="Mức sẵn sàng phỏng vấn" value="82%" delta="+6 điểm tuần này" tone="good" />
        <MetricCard label="Điểm trả lời trung bình" value="8.6/10" delta="+0.8 xu hướng" tone="good" />
        <MetricCard label="Vị trí đang khớp" value="9" delta="3 vị trí ưu tiên cao" tone="default" />
        <MetricCard label="Chuỗi luyện tập" value="11 ngày" delta="Cao nhất quý này" tone="good" />
      </section>

      <section className="two-col">
        <SectionCard
          title="Kế hoạch trọng tâm hôm nay"
          subtitle="Cập nhật CV, nhắm vị trí và mock interview"
          action={<Pill tone="success">Đúng tiến độ</Pill>}
        >
          <ul className="clean-list">
            <li>Tải phiên bản CV mới nhất và phân tích lại với AI.</li>
            <li>Xác thực mức phù hợp với JD mục tiêu.</li>
            <li>Hoàn thành 1 phiên mô phỏng giọng nói 25 phút.</li>
          </ul>
          <div className="inline-actions">
            <Button onClick={onStartJourney}>Tiếp tục lộ trình</Button>
            <Button variant="ghost" onClick={onHistory}>
              Xem lịch sử
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="Xu hướng sẵn sàng theo tuần" subtitle="Mức tự tin qua 7 phiên gần nhất">
          <div className="mini-chart">
            {READINESS_BARS.map((value, index) => (
              <div key={index} className="mini-bar-wrap">
                <span className="mini-bar" style={{ height: `${value}%` }} />
                <small>N{index + 1}</small>
              </div>
            ))}
          </div>
          <Button variant="soft" onClick={onAnalytics}>
            Mở phân tích chuyên sâu
          </Button>
        </SectionCard>
      </section>
    </div>
  );
}

export function CvUploadScreen({
  uploadedCv,
  setUploadedCv,
  isParsingCv,
  parseStage,
  isCvParsed,
  onParse,
  onNext,
}) {
  return (
    <div className="page-grid">
      <section className="two-col">
        <SectionCard title="Tải CV" subtitle="Thả CV mới nhất để làm giàu ngữ cảnh hồ sơ">
          <div className="dropzone">
            <strong>Kéo và thả CV vào đây</strong>
            <p>Hỗ trợ PDF, DOCX, tối đa 10MB.</p>
            <input
              aria-label="Tên file CV"
              value={uploadedCv}
              onChange={(event) => setUploadedCv(event.target.value)}
              placeholder="ung_vien_cv.pdf"
            />
          </div>
          <div className="inline-actions">
            <Button onClick={onParse} disabled={isParsingCv}>
              {isParsingCv ? "Đang phân tích CV..." : "Phân tích bằng AI"}
            </Button>
            <Button variant="ghost" onClick={onNext} disabled={!isCvParsed}>
              Tiếp tục sang khớp JD
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="Pipeline phân tích AI" subtitle="Trích xuất ngữ cảnh và chấm tín hiệu hồ sơ">
          <ul className="pipeline-list">
            {PARSE_STAGES.map((stage, index) => {
              const done = parseStage > index || (isCvParsed && !isParsingCv);
              const active = parseStage === index && isParsingCv;
              return (
                <li key={stage} className={`${done ? "done" : ""} ${active ? "active" : ""}`}>
                  <span className="status-dot" />
                  <div>
                    <strong>{stage}</strong>
                    <p>{done ? "Đã hoàn thành" : active ? "Đang chạy" : "Đang chờ"}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      </section>
    </div>
  );
}

export function JdMatchScreen({ onNext }) {
  return (
    <div className="page-grid">
      <section className="two-col">
        <SectionCard title="Job Description mục tiêu" subtitle="Senior IT Risk - Techcombank">
          <ul className="clean-list">
            <li>Tối thiểu 4 năm kinh nghiệm quản trị rủi ro CNTT.</li>
            <li>Khả năng đánh giá kiểm soát và mức độ tuân thủ.</li>
            <li>Phối hợp tốt với khối vận hành, bảo mật và kiểm toán.</li>
            <li>Kinh nghiệm xử lý sự cố và truyền thông với stakeholder.</li>
          </ul>
          <Button onClick={onNext}>Tiếp tục thiết lập phỏng vấn</Button>
        </SectionCard>

        <SectionCard title="Điểm khớp AI" subtitle="Đối chiếu bằng chứng từ CV với kỳ vọng trong JD">
          <div className="score-ring" style={{ "--score": "87%" }}>
            <strong>87%</strong>
            <span>Tổng mức khớp</span>
          </div>
          <div className="progress-stack">
            <ProgressLine label="Khớp kỹ năng cốt lõi" value={91} />
            <ProgressLine label="Phù hợp lĩnh vực" value={86} />
            <ProgressLine label="Tín hiệu lãnh đạo" value={82} />
          </div>
        </SectionCard>
      </section>
    </div>
  );
}

export function InterviewSetupScreen({ interviewMode, setInterviewMode, onStart }) {
  const [duration, setDuration] = useState("25");
  const [difficulty, setDifficulty] = useState("Nâng cao");
  const [focus, setFocus] = useState("Risk management + Control assurance");

  return (
    <div className="page-grid">
      <section className="two-col">
        <SectionCard title="Cấu hình phỏng vấn" subtitle="Tùy chỉnh phiên AI trước khi bắt đầu">
          <div className="form-grid">
            <label>
              Chế độ
              <div className="toggle-row">
                <button className={interviewMode === "voice" ? "active" : ""} onClick={() => setInterviewMode("voice")}>
                  Giọng nói
                </button>
                <button className={interviewMode === "text" ? "active" : ""} onClick={() => setInterviewMode("text")}>
                  Văn bản
                </button>
              </div>
            </label>
            <label>
              Thời lượng (phút)
              <select value={duration} onChange={(event) => setDuration(event.target.value)}>
                <option value="15">15</option>
                <option value="25">25</option>
                <option value="35">35</option>
              </select>
            </label>
            <label>
              Độ khó
              <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
                <option>Trung cấp</option>
                <option>Nâng cao</option>
                <option>Principal</option>
              </select>
            </label>
            <label>
              Trọng tâm
              <input value={focus} onChange={(event) => setFocus(event.target.value)} />
            </label>
          </div>
          <Button onClick={onStart}>Bắt đầu phiên phỏng vấn</Button>
        </SectionCard>

        <SectionCard title="Checklist trước phiên" subtitle="Mọi thứ cần thiết cho phiên phỏng vấn">
          <ul className="check-list">
            <li className="done">Đã phân tích CV</li>
            <li className="done">Đã khớp JD</li>
            <li className="done">Đã cấp quyền micro</li>
            <li>Nên chọn môi trường yên tĩnh</li>
            <li>Chuẩn bị ví dụ theo STAR</li>
          </ul>
        </SectionCard>
      </section>
    </div>
  );
}

export function InterviewWaitingScreen({ onBack, onStart }) {
  const progress = 53;
  const steps = [
    { title: "Chuẩn bị phòng phỏng vấn", subtitle: "Phòng đã sẵn sàng", status: "done" },
    { title: "Chuẩn bị kịch bản phỏng vấn", subtitle: "Đang xử lý...", status: "active" },
    { title: "Agent tham gia phỏng vấn", subtitle: "Đang chờ...", status: "pending" },
  ];

  return (
    <section className="waiting-shell">
      <div className="waiting-overlay" />
      <article className="waiting-card">
        <header className="waiting-card-head">
          <span className="waiting-head-icon">
            <BriefcaseBusiness className="h-7 w-7" />
          </span>
          <h2>Đang chuẩn bị phòng phỏng vấn</h2>
          <p>Vui lòng chờ trong giây lát...</p>
        </header>

        <div className="waiting-card-body">
          <div className="waiting-step-list">
            {steps.map((item) => (
              <div key={item.title} className={`waiting-step ${item.status}`}>
                <div className="waiting-step-icon">
                  {item.status === "done" ? <CheckCircle2 className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                </div>
                <div className="waiting-step-text">
                  <strong>{item.title}</strong>
                  <span>{item.subtitle}</span>
                </div>
                <span className="waiting-step-dot" />
              </div>
            ))}
          </div>

          <div className="waiting-progress-head">
            <span>Đang chuẩn bị kịch bản...</span>
            <strong>{progress}%</strong>
          </div>
          <div className="waiting-progress-track">
            <span style={{ width: `${progress}%` }} />
          </div>

          <footer className="waiting-card-actions">
            <button type="button" className="waiting-ghost-btn" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </button>
            <button type="button" className="waiting-primary-btn" onClick={onStart}>
              Vào phòng phỏng vấn
            </button>
          </footer>
        </div>
      </article>
    </section>
  );
}

export function LiveInterviewScreen({
  interviewMode,
  setInterviewMode,
  sessionSeconds,
  question,
  activeQuestion,
  draftAnswer,
  setDraftAnswer,
  onSubmitAnswer,
  onEndInterview,
}) {
  const roadmap = [
    { group: "Culture Fit", item: "Motivation for this role", status: "active" },
    { group: "Technical Skills", item: "Risk controls in banking", status: "pending" },
    { group: "Technical Skills", item: "Incident response scenario", status: "pending" },
    { group: "Behavioral", item: "Conflict with stakeholder", status: "pending" },
  ];

  return (
    <section className="live-stage">
      <aside className="live-side left">
        <header className="live-side-head">
          <Lightbulb className="h-4 w-4" />
          <strong>Gợi ý trả lời</strong>
        </header>

        <article className="live-side-card">
          <h4>Cấu trúc câu trả lời</h4>
          <ul>
            <li>Nêu lý do bạn quan tâm đến vị trí và tổ chức.</li>
            <li>Liên hệ kinh nghiệm quản trị rủi ro CNTT đã làm.</li>
            <li>Nêu tác động đo lường được trong dự án tương tự.</li>
            <li>Chốt bằng hướng đóng góp 6-12 tháng đầu.</li>
          </ul>
        </article>
      </aside>

      <main className="live-center">
        <div className="live-center-top">
          <span className="live-role-chip">Senior IT Risk</span>
          <span className="live-time-chip">
            <Clock3 className="h-4 w-4" />
            {formatTime(sessionSeconds)}
          </span>
        </div>

        <div className="live-video-row">
          <article className="live-avatar-card">
            <span className="talking-badge">ĐANG NÓI</span>
            <div className="avatar-illustration">AI</div>
            <div className="avatar-label">X Interview</div>
          </article>

          <div className="live-center-mark">✕</div>

          <article className="live-camera-card">
            <div className="camera-preview">Camera người dùng</div>
          </article>
        </div>

        <article className="live-question">
          <span className="question-index">
            Câu {activeQuestion + 1}/{INTERVIEW_QUESTIONS.length}
          </span>
          <p>{question}</p>
        </article>

        <label className="live-answer-input">
          Nội dung trả lời
          <textarea
            rows={3}
            value={draftAnswer}
            onChange={(event) => setDraftAnswer(event.target.value)}
            placeholder="Nhập ý chính trước khi ghi âm hoặc gửi..."
          />
        </label>

        <footer className="live-toolbar-v2">
          <div className="tool-group">
            <button type="button">
              <Video className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setInterviewMode(interviewMode === "voice" ? "text" : "voice")}>
              {interviewMode === "voice" ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </button>
            <button type="button">
              <VideoOff className="h-4 w-4" />
            </button>
          </div>

          <button type="button" className="record-main-btn" onClick={onSubmitAnswer}>
            {interviewMode === "voice" ? "Bắt đầu ghi âm" : "Gửi trả lời"}
          </button>

          <button type="button" className="hangup-btn" onClick={onEndInterview}>
            <PhoneOff className="h-4 w-4" />
          </button>
        </footer>
      </main>

      <aside className="live-side right">
        <header className="live-side-head">
          <Map className="h-4 w-4" />
          <strong>Lộ trình phỏng vấn</strong>
          <span>Bước {activeQuestion + 1}/12</span>
        </header>

        <div className="roadmap-list">
          {roadmap.map((item, index) => (
            <article key={`${item.group}-${index}`} className={`roadmap-item ${item.status}`}>
              <div className="roadmap-index">{index + 1}</div>
              <div>
                <p>{item.group}</p>
                <strong>{item.item}</strong>
              </div>
            </article>
          ))}
        </div>
      </aside>
    </section>
  );
}

export function AiEvaluationScreen({ progress, done, onOpenResult, onBack }) {
  const tasks = [
    "Chấm điểm theo chiều kỹ thuật và hành vi",
    "Đối chiếu transcript với năng lực vị trí",
    "Sinh gợi ý coaching cá nhân hóa",
    "Tổng hợp scorecard cho nhà tuyển dụng",
  ];

  return (
    <div className="evaluation-screen">
      <SectionCard title="Công cụ đánh giá AI" subtitle="Đang tạo phân tích phỏng vấn">
        <div className="evaluation-center">
          <div className="progress-circle" style={{ "--progress": `${progress}%` }}>
            <strong>{progress}%</strong>
          </div>
          <p>Đang xử lý transcript và tín hiệu năng lực để tạo báo cáo cuối cùng.</p>
        </div>

        <div className="task-list">
          {tasks.map((task, index) => {
            const threshold = (index + 1) * 24;
            const active = progress >= threshold;
            return (
              <div key={task} className={`task-row ${active ? "done" : ""}`}>
                <span className="status-dot" />
                <span>{task}</span>
                <small>{active ? "Hoàn tất" : "Đang xử lý"}</small>
              </div>
            );
          })}
        </div>

        {!done ? (
          <div className="skeleton-grid">
            <div className="skeleton-card tiny" />
            <div className="skeleton-card tiny" />
          </div>
        ) : null}

        <div className="inline-actions">
          <Button variant="ghost" onClick={onBack}>
            Quay lại phiên
          </Button>
          <Button onClick={onOpenResult} disabled={!done}>
            Mở kết quả
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}
