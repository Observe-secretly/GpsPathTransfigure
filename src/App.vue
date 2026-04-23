<template>
  <div class="app-shell">
    <div class="map-tabs" role="tablist" aria-label="地图切换">
      <button
        class="tab"
        :class="{ active: activeTab === 'amap' }"
        type="button"
        role="tab"
        :aria-selected="activeTab === 'amap'"
        @click="setTab('amap')"
      >
        高德地图
      </button>
      <button
        class="tab"
        :class="{ active: activeTab === 'gmap' }"
        type="button"
        role="tab"
        :aria-selected="activeTab === 'gmap'"
        @click="setTab('gmap')"
      >
        Google地图
      </button>
    </div>

    <div class="map-stage">
      <Amap v-if="activeTab === 'amap'" />
      <Gmap v-else />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import Amap from './Amap.vue'
import Gmap from './Gmap.vue'

/** 与上次用户选择一致，下次打开默认该地图 */
const MAP_TAB_STORAGE_KEY = 'gpspath-active-map-tab'
const VALID_TABS = ['amap', 'gmap']

function readStoredMapTab() {
  try {
    const raw = localStorage.getItem(MAP_TAB_STORAGE_KEY)
    if (raw && VALID_TABS.includes(raw)) {
      return raw
    }
  } catch {
    /* 隐私模式等可能不可用 */
  }
  return 'amap'
}

const activeTab = ref(readStoredMapTab())

function setTab(tab) {
  if (VALID_TABS.includes(tab)) {
    activeTab.value = tab
  }
}

watch(activeTab, (tab) => {
  try {
    localStorage.setItem(MAP_TAB_STORAGE_KEY, tab)
  } catch {
    /* ignore */
  }
})
</script>

<style scoped>
.app-shell {
  height: calc(100vh - 20px);
  width: calc(100vw - 20px);
  overflow: hidden;
  position: relative;
  background: #f6f7f9;
}

.map-stage {
  height: 100%;
  width: 100%;
}

.map-tabs {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.tab {
  border: none;
  background: transparent;
  color: rgba(0, 0, 0, 0.7);
  font-size: 12px;
  line-height: 20px;
  padding: 7px 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 120ms ease, color 120ms ease, box-shadow 120ms ease;
  white-space: nowrap;
}

.tab.active {
  background: rgba(255, 255, 255, 0.98);
  color: rgba(0, 0, 0, 0.92);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}
</style>

