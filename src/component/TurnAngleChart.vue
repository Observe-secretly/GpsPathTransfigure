<template>
  <div
    class="turnangle-chart"
    ref="containerEl"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
  >
    <canvas ref="canvasEl"></canvas>
    <div
      v-if="hoverInfo.visible"
      class="chart-tooltip"
      :style="{ left: `${hoverInfo.left}px`, top: `${hoverInfo.top}px` }"
    >
      <div class="tooltip-row">时间：{{ hoverInfo.time || '--' }}</div>
      <div class="tooltip-row">值：{{ hoverInfo.valueText }}</div>
      <div
        v-for="(line, idx) in hoverInfo.detailLines"
        :key="idx"
        class="tooltip-row tooltip-detail"
      >
        {{ line }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  data: {
    type: Array,
    required: true,
    default: () => []
  },
  valueKey: {
    type: String,
    required: false,
    default: 'turnAngle'
  },
  colorKey: {
    type: String,
    required: false,
    default: 'driftMergedColor'
  },
  fallbackColorKey: {
    type: String,
    required: false,
    default: 'displayColor'
  },
  normalColor: {
    type: String,
    required: false,
    default: '#8a8f98'
  },
  yMin: {
    type: Number,
    required: false,
    default: null
  },
  yMax: {
    type: Number,
    required: false,
    default: null
  },
  yPaddingRatio: {
    type: Number,
    required: false,
    default: 0.1
  },
  minTimeLabelSpacing: {
    type: Number,
    required: false,
    default: 96
  },
  fixedTimeGap: {
    type: Number,
    required: false,
    default: 100
  }
})

const containerEl = ref(null)
const canvasEl = ref(null)
const ctx = ref(null)
const TOOLTIP_DETAIL_KEYS = [
  'rawSpeed',
  'rawDirection',
  'hdop',
  'vdop',
  'satelliteCount',
  'windowLowSpeedRatioPct',
  'windowRawSpeedMedian',
  'isLowSpeedCandidate',
  'candidateReason'
]

const hoverInfo = ref({
  visible: false,
  left: 0,
  top: 0,
  time: '',
  valueText: '--',
  detailLines: []
})
const renderMeta = ref({
  series: [],
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  innerW: 0
})

const parseSeries = () => {
  // 兼容两种输入：
  // - number[]  直接是角度序列
  // - 对象数组：按 props.valueKey / props.colorKey 提取
  return (props.data || []).map((item, idx) => {
    if (typeof item === 'number') {
      return { x: idx, y: Number.isFinite(item) ? item : null, color: props.normalColor, timeLabel: '', rawRow: null }
    }
    const value = item && typeof item === 'object' ? item[props.valueKey] : null
    const color = item && typeof item === 'object'
      ? (item[props.colorKey] || item[props.fallbackColorKey] || props.normalColor)
      : props.normalColor
    const timeLabel = item && typeof item === 'object'
      ? (item.currentTime || item.middleTime || item.toTime || item.fromTime || '')
      : ''
    const rawRow = item && typeof item === 'object' ? item : null
    return { x: idx, y: Number.isFinite(value) ? value : null, color, timeLabel, rawRow }
  })
}

const resizeAndRender = () => {
  if (!containerEl.value || !canvasEl.value) return
  const width = containerEl.value.clientWidth
  const height = containerEl.value.clientHeight
  if (!width || !height) return

  const dpr = window.devicePixelRatio || 1
  canvasEl.value.width = Math.floor(width * dpr)
  canvasEl.value.height = Math.floor(height * dpr)
  canvasEl.value.style.width = `${width}px`
  canvasEl.value.style.height = `${height}px`

  const context = canvasEl.value.getContext('2d')
  ctx.value = context
  context.setTransform(dpr, 0, 0, dpr, 0, 0)

  draw()
}

const draw = () => {
  if (!ctx.value || !containerEl.value) return
  const w = containerEl.value.clientWidth
  const h = containerEl.value.clientHeight
  const padding = { top: 18, right: 12, bottom: 36, left: 34 }
  const innerW = Math.max(1, w - padding.left - padding.right)
  const innerH = Math.max(1, h - padding.top - padding.bottom)

  const series = parseSeries()
  const ys = series.map(p => p.y).filter(v => v !== null)
  const hasData = ys.length > 0

  const autoMinY = hasData ? Math.min(...ys) : -1
  const autoMaxY = hasData ? Math.max(...ys) : 1
  const autoRange = autoMaxY - autoMinY
  const autoPadding = autoRange === 0
    ? Math.max(Math.abs(autoMaxY) * props.yPaddingRatio, 1)
    : autoRange * props.yPaddingRatio
  const expandedAutoMinY = autoMinY - autoPadding
  const expandedAutoMaxY = autoMaxY + autoPadding
  const minY = Number.isFinite(props.yMin) ? props.yMin : expandedAutoMinY
  const maxY = Number.isFinite(props.yMax) ? props.yMax : expandedAutoMaxY
  const safeMinY = minY === maxY ? minY - 1 : minY
  const safeMaxY = minY === maxY ? maxY + 1 : maxY

  const mapX = (idx) => padding.left + (series.length <= 1 ? 0 : (idx / (series.length - 1)) * innerW)
  const mapY = (v) => padding.top + (1 - (v - safeMinY) / (safeMaxY - safeMinY)) * innerH
  renderMeta.value = {
    series,
    padding,
    innerW
  }

  // clear
  ctx.value.clearRect(0, 0, w, h)

  // background
  ctx.value.fillStyle = 'rgba(255,255,255,0.88)'
  ctx.value.fillRect(0, 0, w, h)

  // grid + axes
  ctx.value.strokeStyle = 'rgba(0,0,0,0.08)'
  ctx.value.lineWidth = 1
  const gridLines = 4
  for (let i = 0; i <= gridLines; i++) {
    const gy = padding.top + (i / gridLines) * innerH
    ctx.value.beginPath()
    ctx.value.moveTo(padding.left, gy)
    ctx.value.lineTo(padding.left + innerW, gy)
    ctx.value.stroke()
  }

  // zero line
  const zeroY = mapY(0)
  ctx.value.strokeStyle = 'rgba(255,140,0,0.55)'
  ctx.value.setLineDash([4, 4])
  ctx.value.beginPath()
  ctx.value.moveTo(padding.left, zeroY)
  ctx.value.lineTo(padding.left + innerW, zeroY)
  ctx.value.stroke()
  ctx.value.setLineDash([])

  // y labels (min/0/max)
  ctx.value.fillStyle = 'rgba(0,0,0,0.65)'
  ctx.value.font = '12px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'
  const drawLabel = (val) => {
    const y = mapY(val)
    ctx.value.fillText(String(Math.round(val)), 6, y + 4)
  }
  drawLabel(safeMaxY)
  drawLabel(0)
  drawLabel(safeMinY)

  // polyline (skip nulls). 按点位 displayColor 分段绘制
  ctx.value.lineWidth = 0.8
  for (let i = 1; i < series.length; i++) {
    const previous = series[i - 1]
    const current = series[i]
    if (previous.y === null || current.y === null) {
      continue
    }
    ctx.value.strokeStyle = current.color || previous.color || '#8a8f98'
    ctx.value.beginPath()
    ctx.value.moveTo(mapX(i - 1), mapY(previous.y))
    ctx.value.lineTo(mapX(i), mapY(current.y))
    ctx.value.stroke()
  }

  // time labels: 根据画布宽度 + 单个时间文本宽度 + 固定间距，动态控制数量，避免重叠
  const sampleLabel = series.find(item => item.timeLabel)?.timeLabel || '0000-00-00 00:00:00'
  const timeTextWidth = ctx.value.measureText(sampleLabel).width
  const spacingByWidth = timeTextWidth + props.fixedTimeGap
  const requiredSpacing = Math.max(props.minTimeLabelSpacing, spacingByWidth)
  const maxLabels = Math.max(2, Math.floor(innerW / requiredSpacing))
  const labelStep = Math.max(1, Math.ceil(Math.max(1, series.length - 1) / Math.max(1, maxLabels - 1)))
  ctx.value.fillStyle = 'rgba(0,0,0,0.52)'
  ctx.value.font = '11px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'
  ctx.value.textAlign = 'center'
  let lastLabelX = Number.NEGATIVE_INFINITY
  for (let i = 0; i < series.length; i += labelStep) {
    const label = series[i].timeLabel
    if (!label) continue
    const x = mapX(i)
    if (x - lastLabelX < requiredSpacing) continue
    ctx.value.fillText(label, x, h - 8)
    lastLabelX = x
  }
  const last = series[series.length - 1]
  if (last && last.timeLabel) {
    const lastX = mapX(series.length - 1)
    if (lastX - lastLabelX >= requiredSpacing * 0.6) {
      ctx.value.fillText(last.timeLabel, lastX, h - 8)
    }
  }
  ctx.value.textAlign = 'start'
}

const findNearestUsablePoint = (series, index) => {
  if (!series.length) return null
  if (series[index] && series[index].y !== null) return series[index]
  for (let offset = 1; offset < series.length; offset++) {
    const left = index - offset
    const right = index + offset
    if (left >= 0 && series[left]?.y !== null) return series[left]
    if (right < series.length && series[right]?.y !== null) return series[right]
  }
  return null
}

const handleMouseMove = (e) => {
  if (!containerEl.value) return
  const meta = renderMeta.value
  const { series, padding, innerW } = meta
  if (!series || series.length === 0 || innerW <= 0) return
  const rect = containerEl.value.getBoundingClientRect()
  const localX = e.clientX - rect.left
  const ratio = series.length <= 1 ? 0 : (localX - padding.left) / innerW
  const clampedRatio = Math.max(0, Math.min(1, ratio))
  const index = Math.round(clampedRatio * (series.length - 1))
  const point = findNearestUsablePoint(series, index)
  if (!point || point.y === null) {
    hoverInfo.value.visible = false
    return
  }

  const tooltipWidth = 170
  const detailLines = []
  const rawRow = point.rawRow
  if (rawRow && typeof rawRow === 'object') {
    TOOLTIP_DETAIL_KEYS.forEach((key) => {
      const v = rawRow[key]
      if (v === undefined || v === null) return
      if (typeof v === 'string' && v === '') return
      const display = typeof v === 'boolean' ? String(v) : v
      detailLines.push(`${key}: ${display}`)
    })
  }
  const tooltipHeight = 44 + detailLines.length * 16
  const nextLeft = Math.min(
    Math.max(8, localX + 10),
    Math.max(8, rect.width - tooltipWidth - 8)
  )
  const localY = e.clientY - rect.top
  const nextTop = Math.min(
    Math.max(8, localY - tooltipHeight - 10),
    Math.max(8, rect.height - tooltipHeight - 8)
  )
  hoverInfo.value = {
    visible: true,
    left: nextLeft,
    top: nextTop,
    time: point.timeLabel || '',
    valueText: Number(point.y).toFixed(4),
    detailLines
  }
}

const handleMouseLeave = () => {
  hoverInfo.value.visible = false
}

let resizeObserver = null

onMounted(async () => {
  await nextTick()
  resizeAndRender()

  if (window.ResizeObserver && containerEl.value) {
    resizeObserver = new ResizeObserver(() => resizeAndRender())
    resizeObserver.observe(containerEl.value)
  } else {
    window.addEventListener('resize', resizeAndRender)
  }
})

onUnmounted(() => {
  if (resizeObserver && containerEl.value) {
    resizeObserver.disconnect()
  } else {
    window.removeEventListener('resize', resizeAndRender)
  }
})

watch(
  () => props.data,
  () => {
    resizeAndRender()
  },
  { deep: true }
)
</script>

<style scoped>
.turnangle-chart {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 10px;
  overflow: hidden;
}

.chart-tooltip {
  position: absolute;
  min-width: 156px;
  background: rgba(17, 24, 39, 0.92);
  color: #fff;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 11px;
  line-height: 1.35;
  pointer-events: none;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
  z-index: 3;
}

.tooltip-row {
  white-space: nowrap;
}

.tooltip-detail {
  white-space: normal;
  max-width: 280px;
}
</style>

