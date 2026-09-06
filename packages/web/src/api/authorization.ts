export type ApprovalStatus = "pending" | "approved" | "rejected";

export function canAccessProtectedContent(user: { role: string; isActive: boolean; approvalStatus: ApprovalStatus }) {
  return user.isActive && (user.role === "admin" || user.approvalStatus === "approved");
}
