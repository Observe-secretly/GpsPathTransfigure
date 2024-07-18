import { createApp } from 'vue'
import Amap from './Amap.vue'
import Gmap from './Gmap.vue'
import "/index"

createApp(Amap).mount('#amap')
createApp(Gmap).mount('#gmap')