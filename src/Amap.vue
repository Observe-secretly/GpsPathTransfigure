<template>
  <div class="mapContainer">
    <div id="amapContainer" style="height: 100vh;" tabindex="0"></div>
    <div class="scroll-container">
      <div class="card-container">
        <div v-for="(segment, index) in segmentInfoData" :key="index" class="card">
          <div class="card-header">{{ segment.type === 'motion' ? '运动' : '停留' }}</div>
          <div class="card-body">
            <p><strong>开始位置:</strong> Lat: {{ segment.startPosition.lat }}, Lng: {{ segment.startPosition.lng }}</p>
            <p><strong>结束位置:</strong> Lat: {{ segment.endPosition.lat }}, Lng: {{ segment.endPosition.lng }}</p>
            <p><strong>持续时间:</strong> {{ segment.duration }} </p>
            <p><strong>开始时间:</strong> {{ segment.startTime }}</p>
            <p><strong>结束时间:</strong> {{ segment.endTime }}</p>
            <p v-if="segment.type === 'motion'"><strong>距离:</strong> {{ segment.distance }} </p>
          </div>
        </div>
      </div>
    </div> 
  </div>
    

</template>


<script setup>
  import { ref, onMounted } from 'vue';
  import GpsPathTransfigure from "/index.js"
  const segmentInfoData = ref([]);

  const jsApiKey = import.meta.env.VITE_AMAP_JS_API_KEY;
  const webApiKey = import.meta.env.VITE_AMAP_WEB_API_KEY;
  const script = document.createElement('script');
  script.src = `https://webapi.amap.com/maps?v=2.0&key=${jsApiKey}&plugin=AMap.GraspRoad`;
  document.head.appendChild(script);

  onMounted(async ()=>{
    var antResults = []

    try {
        let response = await fetch('/src/json/amap.json');
        let data = await response.json();
        antResults = data; // 将 JSON 数据赋值给 antResults 数组

        // Example usage:
        var pathParam =[]
        for (var i = 0; i <antResults.data[0].locations.length; i++) {
            var item = antResults.data[0].locations[i]
            pathParam[i]={lng: item.longitude1,lat: item.latitude1,currentTime:item.currentTime}
        }

        GpsPathTransfigure.conf({
          locale:'zh',
          aMapKey:webApiKey,
          defaultMapService:'amap',
          openDebug:false,
        })
        const staticPoints = await GpsPathTransfigure.optimize(pathParam);
        const { finalPoints, stopPoints, center, zoom ,segmentInfo} = staticPoints;
        segmentInfoData.value = segmentInfo

        var map = new AMap.Map('amapContainer', {
            resizeEnable: true,
            center:[center.lng,center.lat],
            zoom:zoom
        });


        for(var i=0;i<stopPoints.length;i+=1){
          var stopPoint = stopPoints[i]
        
          var marker = new AMap.Marker({
            icon: new AMap.Icon({
              image:"data:image/png;base64,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",
              size: new AMap.Size(32, 32),
              imageSize: new AMap.Size(32, 32)
            }),
            position: [stopPoint.lng, stopPoint.lat],
            offset: new AMap.Pixel(-16, -16)
          });
          marker.setMap(map);
        }

      var graspRoad;


      var path1 = [];
      for(var i=0;i<finalPoints.length;i+=1){
        path1.push([finalPoints[i].lng,finalPoints[i].lat])
      }
      var newLine = new AMap.Polyline({
        path:path1,
        strokeWeight:8,
        strokeOpacity:1,
        strokeColor:'#0091ea'
      })
      //渲染优化后的点
      map.add(newLine)

      if(!graspRoad) {
          graspRoad = new AMap.GraspRoad()
      }

      var path2 = [];
      for(var i=0;i<pathParam.length;i+=1){
        path2.push([pathParam[i].lng,pathParam[i].lat])
      }
      var oldLine = new AMap.Polyline({
        path:path2,
        strokeWeight:8,
        strokeOpacity:0.8,
        strokeColor:'red',
        showDir:true
      })
      //渲染优化前的点
      // map.add(oldLine)

    } catch (error) {
        console.error('Fetch error:', error);
    }
  })

 
  
</script>
