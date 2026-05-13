export const DEMO_ACCOUNTS = [
  {
    role: "candidate",
    roleLabel: "Ứng viên",
    name: "Nguyễn Hà Linh",
    email: "candidate@ai-interview.local",
    googleEmail: "candidate.demo@gmail.com",
    password: "123456",
    permissions: ["candidate:dashboard", "candidate:interview", "candidate:analytics"],
  },
  {
    role: "recruiter",
    roleLabel: "Tuyển dụng",
    name: "Trần Minh Anh",
    email: "recruiter@ai-interview.local",
    googleEmail: "recruiter.demo@gmail.com",
    password: "123456",
    permissions: ["recruiter:dashboard", "recruiter:comparison"],
  },
  {
    role: "admin",
    roleLabel: "Quản trị",
    name: "Lê Quang Huy",
    email: "admin@ai-interview.local",
    googleEmail: "admin.demo@gmail.com",
    password: "123456",
    permissions: ["admin:dashboard", "admin:question-bank", "admin:model-settings"],
  },
];

export const LOGIN_PROVIDER_LABEL = {
  password: "Mật khẩu",
  google: "Google",
};
