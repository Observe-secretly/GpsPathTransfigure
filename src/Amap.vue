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
  import  "https://webapi.amap.com/maps?v=2.0&key=[您的jsApi Key]&plugin=AMap.GraspRoad"
  import GpsPathTransfigure from "/index.js"
  const segmentInfoData = ref([]);


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
          aMapKey:'[您的web服务key]',
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
            icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAhFJREFUWEell0tywjAMhuUwZXqJMl3CKQonK5yM9BSw7NBLdOgQM1Ki1HH0sCErILb49PAvOUDFc3p/3eLycLt90rYQthBjG0P4ou9N026+f9sKkxBKF59Wy30A6P/YeCLAYXO57r11/N4FQK/JY/S24ikFMQFKvda4YtPsvJSYAOfVMs6MpzlPXoYYP6QoeRAqgOa9ZVDcE2O7/vnbaVESASjvXXeUNqUAfCrSMEt7LWgZwKh4Npb/UVp057eX4yQdRhREgJmBJBQaAOoBh/p5AKn4BggVAADWlys5JNUCv8vTKkfgAYA0BRKAVgdPAUDX9eKUSbB0fOsikBeRUAPasRLrp7YIS48hQ0yalCDZliyrQiSqIABYRahFRQs/NVRtk6eEVpRSm15Tqu4FtRGwvDcjQOdZkOQaAM97FwAX5FVdDOA0obqBJGlM6BWRK+2XDXttuBhAk1ZrOCoJfRWAlAoVoDD01QAEYfQINuhVfVEzUrXBGFRwT03oiyLAEstNB8dtVaCGcRzfs/GS8VwfyYRRnD3MIbTfCWQYYjWYGYA0zdDNp2noxsPz37guKTqKGLfoXuf/LzIIslgc8jF9AjB6pizOawPXe2Emm6wZwgmZAKReodeecUsL0lbNNyupSMtTgBazNKQAY8Hij123nSmlog/6WO5IbYn3DxWhlOdR++mDckmNcbyWS0WrAd8B+JXLMMpEbqAAAAAASUVORK5CYII=",
            position: [stopPoint.lng, stopPoint.lat],
            offset: new AMap.Pixel(-13, -30)
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
