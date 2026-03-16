"use client"

import { motion } from "framer-motion"
import { Info } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

export interface ProgressionDataPoint {
  month: string
  blitz:  number
  bullet: number
  rapid:  number
}

interface ProgressionChartProps {
  data: ProgressionDataPoint[]
}

export function ProgressionChart({ data }: ProgressionChartProps) {
  // Derive a sensible Y-axis minimum: floor to nearest 50 below the lowest value
  const allValues = data.flatMap(d => [d.blitz, d.bullet, d.rapid])
  const minVal    = Math.min(...allValues)
  const maxVal    = Math.max(...allValues)
  const yMin      = Math.max(0, Math.floor(minVal / 50) * 50)
  const yMax      = Math.ceil((maxVal + 20) / 50) * 50

  return (
    <motion.div
      className="bg-white rounded-2xl p-5"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15 }}
    >
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Overview</p>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1a237e]">Progression</h2>
          <p className="text-xs text-gray-400 mt-0.5">Elo based on gamemodes</p>
        </div>
        <button className="text-gray-400 hover:text-gray-600 transition-colors mt-1">
          <Info className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-4 h-56 md:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              domain={[yMin, yMax]}
            />
            <Tooltip
              contentStyle={{
                background: "#1f2937",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                fontSize: 12,
              }}
              itemStyle={{ color: "#fff" }}
              labelStyle={{ color: "#d1d5db", marginBottom: 4 }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="line"
              iconSize={20}
              wrapperStyle={{ paddingTop: 12, fontSize: 12 }}
            />
            <Line type="monotone" dataKey="blitz"  stroke="#1d3a8a" strokeWidth={2} dot={{ r: 4, fill: "#1d3a8a" }} activeDot={{ r: 5 }} animationDuration={900} />
            <Line type="monotone" dataKey="bullet" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4, fill: "#8b5cf6" }} activeDot={{ r: 5 }} animationDuration={900} animationBegin={150} />
            <Line type="monotone" dataKey="rapid"  stroke="#ec4899" strokeWidth={2} dot={{ r: 4, fill: "#ec4899" }} activeDot={{ r: 5 }} animationDuration={900} animationBegin={300} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
