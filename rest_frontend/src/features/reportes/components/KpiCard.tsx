"use client"

import { LucideIcon } from "lucide-react"

const COLOR_MAP: Record<string, string> = {
  green: "text-green-700 bg-green-50 border-green-100",
  blue: "text-blue-700 bg-blue-50 border-blue-100",
  purple: "text-purple-700 bg-purple-50 border-purple-100",
  orange: "text-orange-700 bg-orange-50 border-orange-100",
  red: "text-red-700 bg-red-50 border-red-100",
  indigo: "text-indigo-700 bg-indigo-50 border-indigo-100",
}

const ICON_COLOR_MAP: Record<string, string> = {
  green: "bg-green-100 text-green-700",
  blue: "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
  orange: "bg-orange-100 text-orange-700",
  red: "bg-red-100 text-red-700",
  indigo: "bg-indigo-100 text-indigo-700",
}

interface KpiCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color: "green" | "blue" | "purple" | "orange" | "red" | "indigo"
  subtitle?: string
}

export function KpiCard({ title, value, icon: Icon, color, subtitle }: KpiCardProps) {
  return (
    <div className={`bg-white/80 backdrop-blur-xl border p-5 rounded-[1.75rem] shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow ${COLOR_MAP[color]}`}>
      <div className="flex justify-between items-start">
        <p className="text-xs font-bold uppercase tracking-widest text-current opacity-70">{title}</p>
        <div className={`p-2.5 rounded-xl ${ICON_COLOR_MAP[color]}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="text-3xl font-black text-current tracking-tighter leading-none">{value}</p>
      {subtitle && <p className="text-[10px] font-bold text-current opacity-50">{subtitle}</p>}
    </div>
  )
}
