export const SCREEN_CONFIG = {
  dashboardOverview: {
    title: "Tổng quan",
    sidebarLabel: "Tổng quan",
    icon: "home",
    role: "all",
  },
  profileCv: {
    title: "Quản lý CV và JD",
    sidebarLabel: "Quản lý CV và JD",
    icon: "cv",
    role: "all",
  },
  jobMatch: {
    title: "Việc làm & Đơn ứng tuyển",
    sidebarLabel: "Việc làm & Đơn ứng tuyển",
    icon: "job",
    role: "all",
  },
  interviewHistory: {
    title: "Lịch sử phỏng vấn",
    sidebarLabel: "Lịch sử phỏng vấn",
    icon: "history",
    role: "all",
  },
  servicePlans: {
    title: "Gói dịch vụ",
    sidebarLabel: "Gói dịch vụ",
    icon: "plans",
    role: "all",
  },
};

export const DEFAULT_SCREEN_BY_ROLE = {
  candidate: "dashboardOverview",
  recruiter: "dashboardOverview",
  admin: "dashboardOverview",
};

export const SIDEBAR_GROUPS = [
  {
    title: "Điều hướng chính",
    screens: [
      "dashboardOverview",
      "profileCv",
      "jobMatch",
      "interviewHistory",
      "servicePlans",
    ],
  },
];

export const INTERVIEW_WIZARD_STEPS = [
  "Tải CV/JD",
  "Thiết lập Cam/Mic",
  "Phòng chờ",
  "Phỏng vấn",
];

