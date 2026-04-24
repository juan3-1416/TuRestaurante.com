import { DashboardLayout } from "@/shared/layout/DashboardLayout"

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>
}