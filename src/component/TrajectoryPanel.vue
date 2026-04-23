<template>
  <aside class="side-panel" :class="{ collapsed }" aria-label="轨迹分段与筛选面板">
    <div class="panel-header">
      <div class="panel-title">
        轨迹分段
        <span class="panel-count">{{ segments.length }}</span>
      </div>
      <div class="panel-actions">
        <div class="trajectory-switcher" role="tablist" aria-label="轨迹展示切换">
          <button class="switcher-button" :class="{ active: mode === 'raw' }" @click="emitMode('raw')" type="button"
            role="tab" :aria-selected="mode === 'raw'">
            原始
          </button>
          <button class="switcher-button" :class="{ active: mode === 'optimized' }" @click="emitMode('optimized')"
            type="button" role="tab" :aria-selected="mode === 'optimized'">
            优化
          </button>
          <button class="switcher-button" :class="{ active: mode === 'mixed' }" @click="emitMode('mixed')"
            type="button" role="tab" :aria-selected="mode === 'mixed'">
            混合
          </button>
        </div>
        <button class="panel-collapse" type="button" @click="emitCollapsed(!collapsed)"
          :aria-label="collapsed ? '展开分段卡片列表' : '收起分段卡片列表'">
          {{ collapsed ? '展开' : '收起' }}
        </button>
      </div>
    </div>

    <div v-show="!collapsed" class="panel-body">
      <div class="card-container">
        <div v-for="(segment, index) in segments" :key="index" class="card">
          <div class="card-header">
            <span class="card-type" :class="{ motion: segment.type === 'motion', stop: segment.type !== 'motion' }">
              {{ segment.type === 'motion' ? '运动' : '停留' }}
            </span>
            <span class="card-duration">{{ segment.duration }}</span>
          </div>
          <div class="card-body">
            <div class="card-summary">
              <span class="summary-time">{{ segment.startTime }} - {{ segment.endTime }}</span>
              <span class="summary-metrics" v-if="segment.type === 'motion'">{{ segment.averageSpeed }} / {{
                segment.distance }}</span>
              <span class="summary-metrics" v-else>{{ segment.averageSpeed }}</span>
            </div>
            <div class="card-coords">
              <span class="coord">S: {{ segment.startPosition.lat }},{{ segment.startPosition.lng }}</span>
              <span class="coord">E: {{ segment.endPosition.lat }},{{ segment.endPosition.lng }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
const props = defineProps({
  mode: { type: String, required: true }, // 'raw' | 'optimized' | 'mixed'
  collapsed: { type: Boolean, required: true },
  segments: { type: Array, required: true },
})

const emit = defineEmits(['changeMode', 'toggleCollapsed'])

function emitMode(nextMode) {
  emit('changeMode', nextMode)
}

function emitCollapsed(nextCollapsed) {
  emit('toggleCollapsed', nextCollapsed)
}
</script>

<style scoped>
.side-panel {
  position: absolute;
  top: 16px;
  left: 16px;
  width: min(320px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
  z-index: 120;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  overflow: hidden;
}

.side-panel.collapsed {
  width: max-content;
  max-width: calc(100vw - 32px);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 10px 8px 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.panel-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f1f1f;
  letter-spacing: 0.2px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-count {
  font-size: 12px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.55);
  background: rgba(0, 0, 0, 0.06);
  border-radius: 999px;
  padding: 2px 8px;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.side-panel.collapsed .panel-actions {
  gap: 6px;
}

.panel-collapse {
  border: none;
  background: rgba(0, 0, 0, 0.05);
  color: rgba(0, 0, 0, 0.7);
  font-size: 12px;
  padding: 6px 8px;
  border-radius: 10px;
  cursor: pointer;
  flex: 0 0 auto;
}

.panel-body {
  padding: 8px 8px 10px 8px;
  overflow: auto;
}

.trajectory-switcher {
  display: flex;
  gap: 4px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 10px;
  padding: 4px;
  flex-shrink: 0;
}

.switcher-button {
  border: none;
  background: transparent;
  color: rgba(0, 0, 0, 0.7);
  font-size: 12px;
  line-height: 20px;
  padding: 5px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 120ms ease, color 120ms ease;
}

.switcher-button.active {
  background-color: rgba(255, 255, 255, 0.95);
  color: rgba(0, 0, 0, 0.92);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}

.card-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card {
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(255, 255, 255, 0.9);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 8px 6px 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.card-type {
  font-size: 12px;
  font-weight: 700;
  border-radius: 999px;
  padding: 2px 8px;
  line-height: 16px;
  background: rgba(0, 0, 0, 0.06);
  color: rgba(0, 0, 0, 0.75);
}

.card-type.motion {
  background: rgba(22, 119, 255, 0.12);
  color: rgba(22, 119, 255, 0.95);
}

.card-type.stop {
  background: rgba(250, 140, 22, 0.14);
  color: rgba(250, 140, 22, 0.95);
}

.card-duration {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
}

.card-body {
  padding: 6px 8px 8px 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card-summary {
  display: flex;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.8);
  justify-content: space-between;
  gap: 8px;
}

.summary-time {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.8);
  line-height: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-metrics {
  flex: 0 0 auto;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.65);
  white-space: nowrap;
}

.card-coords {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.coord {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.55);
  line-height: 15px;
}
</style>

