<template>
  <button class="stoppoint-debug-button" type="button" @click="toggleDebug">
    调试数据
  </button>

  <div
    v-if="debugVisible"
    class="stoppoint-debug-window"
    :style="{ left: `${debugPos.x}px`, top: `${debugPos.y}px` }"
  >
    <div class="stoppoint-debug-header" @mousedown="startDrag">
      <div class="stoppoint-debug-title">停留点调试（漂移观测序列）</div>
      <button class="stoppoint-debug-close" type="button" @click="debugVisible = false">×</button>
    </div>
    <div class="stoppoint-debug-body">
      <div class="stoppoint-chart-card">
        <div class="stoppoint-chart-title">规则阈值合并+30分钟过滤后区间（主参考）</div>
        <div class="stoppoint-chart-box">
          <TurnAngleChart
            :data="turnAngleSeries"
            valueKey="turnAngle"
            colorKey="driftMergedColor"
            fallbackColorKey="displayColor"
            :yMin="-180"
            :yMax="180"
          />
        </div>
      </div>
      <div class="stoppoint-chart-card">
        <div class="stoppoint-chart-title">规则阈值原始识别区间（对照）</div>
        <div class="stoppoint-chart-box">
          <TurnAngleChart
            :data="turnAngleSeries"
            valueKey="turnAngle"
            colorKey="displayColor"
            fallbackColorKey="displayColor"
            :yMin="-180"
            :yMax="180"
          />
        </div>
      </div>
      <div class="stoppoint-chart-card">
        <div class="stoppoint-chart-title">规则漂移分数（driftScore，值越高越可能是漂移候选）</div>
        <div class="stoppoint-chart-box">
          <TurnAngleChart
            :data="turnAngleSeries"
            valueKey="driftScore"
            colorKey="driftMergedColor"
            fallbackColorKey="displayColor"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import TurnAngleChart from './TurnAngleChart.vue';

defineProps({
  turnAngleSeries: { type: Array, default: () => [] }
});

const debugVisible = ref(false);
const debugPos = ref({ x: 12, y: 80 });
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

function toggleDebug() {
  debugVisible.value = !debugVisible.value;
}

function startDrag(e) {
  isDragging = true;
  dragOffset = {
    x: e.clientX - debugPos.value.x,
    y: e.clientY - debugPos.value.y
  };
  e.preventDefault();
}

function onDragMove(e) {
  if (!isDragging) return;
  const nextX = e.clientX - dragOffset.x;
  const nextY = e.clientY - dragOffset.y;
  debugPos.value = {
    x: Math.max(8, nextX),
    y: Math.max(8, nextY)
  };
}

function onDragEnd() {
  isDragging = false;
}

onMounted(() => {
  window.addEventListener('mousemove', onDragMove);
  window.addEventListener('mouseup', onDragEnd);
});

onUnmounted(() => {
  window.removeEventListener('mousemove', onDragMove);
  window.removeEventListener('mouseup', onDragEnd);
});
</script>

<style scoped>
.stoppoint-debug-button {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 1020;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.92);
  color: #1f1f1f;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.stoppoint-debug-button:hover {
  background: rgba(255, 255, 255, 0.98);
}

.stoppoint-debug-window {
  position: fixed;
  width: calc(100vw - 120px);
  height: 78vh;
  z-index: 1030;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(10px);
  resize: both;
  min-width: 480px;
  min-height: 320px;
  max-width: calc(100vw - 120px);
  max-height: calc(100vh - 120px);
}

.stoppoint-debug-header {
  height: 38px;
  background: rgba(0, 0, 0, 0.72);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  cursor: move;
  user-select: none;
}

.stoppoint-debug-title {
  font-size: 12px;
  font-weight: 600;
}

.stoppoint-debug-close {
  border: none;
  background: transparent;
  color: #fff;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 0 6px;
}

.stoppoint-debug-body {
  height: calc(100% - 38px);
  background: rgba(255, 255, 255, 0.15);
  padding: 10px;
  overflow: auto;
}

.stoppoint-chart-card {
  margin-bottom: 10px;
}

.stoppoint-chart-card:last-child {
  margin-bottom: 0;
}

.stoppoint-chart-title {
  font-size: 12px;
  font-weight: 600;
  color: #2f2f2f;
  margin-bottom: 6px;
}

.stoppoint-chart-box {
  height: 180px;
  border-radius: 10px;
  overflow: hidden;
}
</style>
