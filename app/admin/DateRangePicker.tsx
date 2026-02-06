'use client'

import { useState } from 'react'

type DateRange = {
  start: string
  end: string
}

type Preset = {
  label: string
  getValue: () => DateRange
}

const presets: Preset[] = [
  {
    label: 'Last 7 days',
    getValue: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 7)
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      }
    }
  },
  {
    label: 'Last 30 days',
    getValue: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 30)
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      }
    }
  },
  {
    label: 'Last 90 days',
    getValue: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 90)
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      }
    }
  },
  {
    label: 'This month',
    getValue: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date()
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      }
    }
  },
  {
    label: 'All time',
    getValue: () => {
      const end = new Date()
      const start = new Date('2020-01-01') // Arbitrary old date
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      }
    }
  }
]

type Props = {
  onChange: (range: DateRange) => void
}

export default function DateRangePicker({ onChange }: Props) {
  const [dateRange, setDateRange] = useState<DateRange>(() => presets[1].getValue()) // Default to Last 30 days
  const [showCustom, setShowCustom] = useState(false)

  const handlePresetClick = (preset: Preset) => {
    const range = preset.getValue()
    setDateRange(range)
    setShowCustom(false)
    onChange(range)
  }

  const handleCustomChange = (field: 'start' | 'end', value: string) => {
    const newRange = { ...dateRange, [field]: value }
    setDateRange(newRange)
    onChange(newRange)
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Date Range</h3>
      
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {presets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handlePresetClick(preset)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
          >
            {preset.label}
          </button>
        ))}
        <button
          onClick={() => setShowCustom(!showCustom)}
          className={`px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${
            showCustom ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          Custom
        </button>
      </div>

      {/* Custom date inputs */}
      {showCustom && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => handleCustomChange('start', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => handleCustomChange('end', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Current selection display */}
      <div className="mt-3 text-xs text-gray-600">
        Showing data from <span className="font-semibold">{dateRange.start}</span> to <span className="font-semibold">{dateRange.end}</span>
      </div>
    </div>
  )
}
