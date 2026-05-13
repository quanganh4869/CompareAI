import { useMemo, useRef, useState } from "react";
import { History, Plus, Search, X } from "lucide-react";
import { Button } from "../shared";

export function PracticeSessionsWindow({
  customCvRows,
  customJobs,
  selectedCvId,
  setSelectedCvId,
  selectedJdId,
  setSelectedJdId,
  sessionName,
  setSessionName,
  onCreateSessionOnly,
  onCreateSessionAndStart,
  practiceSessions,
  selectedSessionId,
  onSelectSession,
  selectedSession,
  onOpenSession,
  disableCreateOnly = false,
  emphasizeStartCta = false,
  onClose,
}) {
  const [query, setQuery] = useState("");
  const showCreatePanel = true;
  const createPanelRef = useRef(null);
  const filteredSessions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return practiceSessions;
    }
    return practiceSessions.filter((session) => {
      const haystack = `${session.title ?? ""} ${session.cvName ?? ""} ${session.jdTitle ?? ""} ${session.id ?? ""}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [practiceSessions, query]);

  const hasAssets = Boolean(customCvRows.length && customJobs.length);

  const focusCreatePanel = () => {
    const root = createPanelRef.current;
    if (!root) {
      return;
    }
    root.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      const target = root.querySelector("select, input, textarea, button");
      if (target && typeof target.focus === "function") {
        target.focus();
      }
    }, 240);
  };

  return (
    <section
      className="legacy-window legacy-window--xl"
      role="dialog"
      aria-modal="true"
      aria-label="Phỏng vấn đã tạo"
      onClick={(event) => event.stopPropagation()}
    >
      <header className="legacy-window-head">
        <div className="legacy-window-title-row">
          <span className="legacy-window-icon">
            <History className="h-4 w-4" />
          </span>
          <div>
            <h3>Phỏng vấn đã tạo</h3>
            <p>{practiceSessions.length ? `${practiceSessions.length} phiên tự luyện đã lưu` : "Chưa có phiên tự luyện nào."}</p>
          </div>
        </div>

        <div className="legacy-window-actions">
          <Button
            variant="ghost"
            onClick={focusCreatePanel}
            className="legacy-window-action legacy-window-icon-action"
            aria-label="Tạo phỏng vấn"
            dataTip="Tạo phỏng vấn"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <button type="button" className="legacy-window-close" onClick={onClose} aria-label="Đóng cửa sổ">
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="legacy-window-toolbar">
        <label className="legacy-window-search">
          <Search className="h-4 w-4" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo tên phiên, CV, JD, mã phiên..."
          />
        </label>
        <span className="legacy-window-chip">{filteredSessions.length}/{practiceSessions.length} mục</span>
      </div>

      {showCreatePanel ? (
        <section ref={createPanelRef} id="legacy-create-session" className="legacy-window-form" aria-label="Tạo phiên tự luyện">
          <div className="legacy-window-form-grid">
            <label>
              Chọn CV
              <select value={selectedCvId} onChange={(event) => setSelectedCvId(event.target.value)}>
                <option value="">-- Chọn CV --</option>
                {customCvRows.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Chọn JD
              <select value={selectedJdId} onChange={(event) => setSelectedJdId(event.target.value)}>
                <option value="">-- Chọn JD --</option>
                {customJobs.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} - {item.company}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="legacy-window-form-full">
            Tên phiên tự luyện
            <input
              value={sessionName}
              onChange={(event) => setSessionName(event.target.value)}
              placeholder="Ví dụ: Mock vòng 1 - IT Risk"
            />
          </label>

          {!hasAssets ? (
            <div className="legacy-window-hint">
              <strong>Thiếu dữ liệu để tạo phiên.</strong>
              <p>Hãy thêm ít nhất 1 CV và 1 JD trước khi tạo phiên tự luyện.</p>
            </div>
          ) : null}

          <div className="legacy-window-form-actions">
            <Button
              variant="ghost"
              onClick={onCreateSessionOnly}
              disabled={disableCreateOnly || !selectedCvId || !selectedJdId}
            >
              Chỉ tạo phiên
            </Button>
            <Button
              onClick={onCreateSessionAndStart}
              disabled={!selectedCvId || !selectedJdId}
              className={emphasizeStartCta ? "legacy-window-primary-cta" : undefined}
            >
              Tạo & vào phỏng vấn
            </Button>
          </div>
        </section>
      ) : null}

      <div className="legacy-window-body">
        <aside className="legacy-window-pane">
          <div className="legacy-window-pane-head">
            <strong>Danh sách phiên</strong>
            <span>Chọn để xem chi tiết</span>
          </div>
          <div className="legacy-window-list-scroll">
            {filteredSessions.length ? (
              filteredSessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  className={`legacy-window-item ${session.id === selectedSessionId ? "active" : ""}`}
                  onClick={() => onSelectSession(session.id)}
                >
                  <div className="legacy-window-item-top">
                    <strong className="legacy-window-item-title">{session.title}</strong>
                    <span className="legacy-window-badge">{session.createdAt}</span>
                  </div>
                  <div className="legacy-window-item-sub">
                    <span className="legacy-window-item-meta">
                      {(session.cvName || "CV tự luyện") + " • " + (session.jdTitle || "JD tự luyện")}
                    </span>
                    <span className="legacy-window-id">{session.id}</span>
                  </div>
                  {typeof session.score === "number" || session.status || session.feedback ? (
                    <div className="legacy-session-chips">
                      {typeof session.score === "number" ? (
                        <span className="legacy-session-chip score">Điểm AI: {session.score}/10</span>
                      ) : null}
                      {session.status ? <span className="legacy-session-chip status">{session.status}</span> : null}
                      {session.feedback ? (
                        <button
                          type="button"
                          className="legacy-session-link"
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectSession(session.id);
                          }}
                        >
                          Xem Feedback
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </button>
              ))
            ) : (
              <div className="legacy-window-empty">
                <strong>Chưa có phiên nào cho bộ lọc này.</strong>
                <p>Tạo phiên mới để AI sinh bộ câu hỏi tự luyện.</p>
              </div>
            )}
          </div>
        </aside>

        <main className="legacy-window-pane legacy-window-pane-detail">
          <div className="legacy-window-pane-head">
            <strong>Chi tiết phiên</strong>
            <span>Câu hỏi AI đã sinh</span>
          </div>
          <div className="legacy-window-detail">
            {selectedSession ? (
              <>
                <div className="legacy-window-kv">
                  <span>Tên phiên</span>
                  <strong>{selectedSession.title}</strong>
                </div>
                <div className="legacy-window-kv">
                  <span>Ngày tạo</span>
                  <strong>{selectedSession.createdAt}</strong>
                </div>
                <div className="legacy-window-kv">
                  <span>CV</span>
                  <strong>{selectedSession.cvName || "CV tự luyện"}</strong>
                </div>
                <div className="legacy-window-kv">
                  <span>JD</span>
                  <strong>{selectedSession.jdTitle || "JD tự luyện"}</strong>
                </div>
                {typeof selectedSession.score === "number" ? (
                  <div className="legacy-window-kv">
                    <span>Điểm AI</span>
                    <strong>{selectedSession.score}/10</strong>
                  </div>
                ) : null}
                {selectedSession.status ? (
                  <div className="legacy-window-kv">
                    <span>Trạng thái</span>
                    <strong>{selectedSession.status}</strong>
                  </div>
                ) : null}

                <div className="legacy-window-block">
                  <strong className="legacy-window-block-title">Bộ câu hỏi</strong>
                  {Array.isArray(selectedSession.questions) && selectedSession.questions.length ? (
                    <ol className="legacy-window-questions">
                      {selectedSession.questions.map((question) => (
                        <li key={question}>{question}</li>
                      ))}
                    </ol>
                  ) : (
                    <p className="legacy-window-paragraph">Chưa có câu hỏi cho phiên này.</p>
                  )}
                </div>

                {selectedSession.feedback ? (
                  <div className="legacy-window-block">
                    <strong className="legacy-window-block-title">Feedback (demo)</strong>
                    <p className="legacy-window-paragraph">{selectedSession.feedback.summary}</p>
                    {Array.isArray(selectedSession.feedback.highlights) && selectedSession.feedback.highlights.length ? (
                      <>
                        <strong className="legacy-window-block-title">Điểm mạnh</strong>
                        <ul className="legacy-window-bullets">
                          {selectedSession.feedback.highlights.slice(0, 4).map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                    {Array.isArray(selectedSession.feedback.improvements) && selectedSession.feedback.improvements.length ? (
                      <>
                        <strong className="legacy-window-block-title">Cần cải thiện</strong>
                        <ul className="legacy-window-bullets">
                          {selectedSession.feedback.improvements.slice(0, 4).map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                  </div>
                ) : null}

                <div className="legacy-window-form-actions">
                  <Button onClick={() => onOpenSession(selectedSession)}>Vào phỏng vấn với AI</Button>
                </div>
              </>
            ) : (
              <div className="legacy-window-empty">
                <strong>Chọn một phiên ở danh sách.</strong>
                <p>Chi tiết phiên và bộ câu hỏi sẽ hiển thị tại đây.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </section>
  );
}
