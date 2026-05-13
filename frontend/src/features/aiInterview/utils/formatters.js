export function roleLabel(role) {
  if (role === "candidate") return "Không Gian Ứng Viên";
  if (role === "recruiter") return "Không Gian Tuyển Dụng";
  return "Không Gian Quản Trị";
}

export function formatTime(seconds) {
  const minute = String(Math.floor(seconds / 60)).padStart(2, "0");
  const second = String(seconds % 60).padStart(2, "0");
  return `${minute}:${second}`;
}
