<template>
    <div id="amapContainer" tabindex="0"></div>
</template>


<script setup>
  import { onMounted } from "vue";
  import  "https://webapi.amap.com/maps?v=2.0&key=[您的key]&plugin=AMap.GraspRoad"
  import GpsPathTransfigure from "/index.js"
  


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
          aMapKey:'您的key',
          defaultMapService:'amap',
        })
        const staticPoints = await GpsPathTransfigure.optimize(pathParam);
        const finalPoints = staticPoints.finalPoints
        const stopPoints = staticPoints.stopPoints
        const center = staticPoints.center
        const zoom = staticPoints.zoom

        var map = new AMap.Map('amapContainer', {
            resizeEnable: true,
            center:[center.lng,center.lat],
            zoom:zoom
        });

        var startPosition = null
        //给开始点设置初始值
        if(finalPoints[0].stopTimeSeconds == null){//如果优化后的第一个点不是停留点，则设置为开始值
            startPosition = finalPoints[0]
        }

        for(var i=0;i<stopPoints.length;i+=1){
          var stopPoint = stopPoints[i]
          
          //计算上个点和这个点之间的距离
          if(startPosition!=null){
              //上个点的结束减去这个点的开始
              var distance = GpsPathTransfigure.calculateDistance(startPosition,stopPoint.startPosition)
              console.log("行驶里程:"+distance)
          }
          console.log(stopPoint.startTime+"<-->"+stopPoint.endTime+" = "+stopPoint.stopTimeSeconds)
          //计算完成后缓存这个点的ent
          startPosition = stopPoint.endPosition
          console.log("")
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

<style  scoped>
    #amapContainer{
        width: 100%;
        height: 95vh;
    }
</style>