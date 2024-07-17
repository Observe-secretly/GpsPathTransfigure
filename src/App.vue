<template>
    <div id="container" tabindex="0"></div>
</template>


<script setup>
  import { onMounted } from "vue";
  import GpsPathTransfigure from "/index.js"


  onMounted(async ()=>{
    var antResults = []


    try {
        let response = await fetch('/src/json/proximityStopMergeTest.json');
        let data = await response.json();
        antResults = data; // 将 JSON 数据赋值给 antResults 数组


        // Example usage:
        var pathParam =[]
        for (var i = 0; i <antResults.data[0].locations.length; i++) {
            var item = antResults.data[0].locations[i]
            pathParam[i]={lon: item.longitude1,lat: item.latitude1,currentTime:item.currentTime}
        }

        GpsPathTransfigure.conf({
          locale:'zh'
        })
        const staticPoints = GpsPathTransfigure.optimize(pathParam);
        const finalPoints = staticPoints.finalPoints
        const stopPoints = staticPoints.stopPoints


        var map = new AMap.Map('container', {
              resizeEnable: true,
          center:[pathParam[0].lon,pathParam[0].lat],
          zoom:15
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
            icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAAuBJREFUaEPtmTFy2zAQRT/SpklqpcgN0tmlpIJVuhzEHp9A5gky9kHSpWIhunS63CBFVCdNSpvxklwPxADgLrDSWDNB46FMQvvw/2JXoMOJD3fi8eM/gK9g9xkrvMIKDsv+8w6r/q9DO17f4RGtuxqvDeQ3UaC7wfVTuBtxPAT0gNoCpBhAHbxP6dC6C6zF4IEbswFGu2xLvvz52Uesc9XIAjANnikyIfIAbrF9TlATCYZJ3KV+V1QDFHl+HrZ2l/2GIB4qAJF1zq+B+0kM9NmuBX4Ou2lqaFXQAcxZhwI93wBf1sBiKAH9oM8o+N3dfuxhKJUKtgAXHXBfA4sl8M4DiC05gQZU0aggBpi1D68+AZCF5gBSdlLsSHYAn7ZD0LfjlHw9DZTB+L6QOkcH4NWnYHwAuv5W74dIuUE5kQIAxHlgowB5n8dUgZj/X5QCnLy8sqSIZMS21kNYiOLpbuAttRch+dq3hq9ICuSYu1ASoN/rxxpA1mBFpgWNYQiYkjwEoOxQxTkwAsT7fh/AT+qYArQ7EcB0vAgAVoSD48JGNYJHTB2F/2kqlQJJG/kKTFc19T//XuXq5wKEbRQKkovW2Wa/yMVspVz9LICoCiEAPxe4xUjsSpoeiKdRWyiZzLTisdZhvpUWV99910kKTuCeaE3ImS/D+0UKzG6pWogM7xcDGEJkWccEoIeY+5WWUqPAOnYAw3Fi3vlQgXXMAAqsVGQdU4AMCJPgswtZzNaifDDwvUkdCEHM/vCnhwx8fzAAgZXMrGOeA/6qBI8fja1zUIBgw2dsnWMA+G23uXUODuCrkNMmS9uprHZaOnmfCw7L0tdI6W5EGo3wvqZp+FR3tfj99T09tnvz8cf4eFtV1fwZu/C7zArZGDS9pfznSPrtn+/49frDNCT6dW8CY2KhEUDb0NVVVQmP8OKSmADw9E3TcEChd8ZsHXrLYbL6ZhZSWNb8VlMFzKMTTHjyAH8BjV0pQKoh+uMAAAAASUVORK5CYII=",
            position: [stopPoint.lon, stopPoint.lat],
            offset: new AMap.Pixel(-13, -30)
          });
          marker.setMap(map);
        }

      var graspRoad;


      var path1 = [];
      for(var i=0;i<finalPoints.length;i+=1){
        path1.push([finalPoints[i].lon,finalPoints[i].lat])
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
        path2.push([pathParam[i].lon,pathParam[i].lat])
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
    #container{
        width: 100%;
        height: 100vh;
    }
    body,html,#app{
      width: 100% !important;
      height: 100% !important;
    }
</style>