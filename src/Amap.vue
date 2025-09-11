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
            <p><strong>时间:</strong> {{ segment.startTime }} - {{ segment.endTime }}</p>
            <p v-if="segment.type === 'motion'"><strong>平均速度/距离:</strong> {{ segment.averageSpeed }} / {{ segment.distance }}</p>
            <p v-else><strong>平均速度:</strong> {{ segment.averageSpeed }}</p>
          </div>
        </div>
      </div>
    </div> 
    
    <div class="map-legend">
      <div class="legend-item">
        <div class="legend-label">平均速度</div>
        <div class="legend-value">{{ avgSpeed }} km/h</div>
      </div>
      <div class="legend-item">
        <div class="legend-label">总里程</div>
        <div class="legend-value">{{ totalMileage }} km</div>
      </div>
    </div>

    <div class="progress">
      <ProgressChart :locale="locale" :data="playPoints" :onMove="handleMove" :setPosition="playPosition" sliderImage="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAASBJREFUaEPtltENgkAQRO/q0H6oRNsQ29BK6EfrwGBi4gey9zIsCXH85bG3s7NyU8vOf3Xn/RcLOJ6HfhzLZXKy1nJ93Lp+yVXKRxsiOfDdzOegJRGUj5p/D60F+sUcTsM49+x572brUr6lt/8WQFeC8ukOTAfQPyXlIxHSCkXFt3huAVtMeekMO2AHxAnIK0Q/i5SP9EkC6MVE+ah5ZyEaziif7gBdCcqnC3AWahlxwEhfoRXOl0tYgDxCsYAdEAcovy47QLMN5SOFkgB6MVE+at5ZiGYbyqc7QFeC8ukCnIVaRuwstMKUMktI90BmY621LaB1Ulmc7ADNNpSPhEsC6MVE+ah5ZyGabSif7gBdCcqnC3AWahmxs9AKU8os8QK/SiBAyMIBIAAAAABJRU5ErkJggg==" />
    </div>
    
    <button class="floating-button" v-on:click ="switchPlay">
      <img v-if="isPlaying==false" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAAXNSR0IArs4c6QAACE5JREFUeF7tnV122zgMhavswvZimq6smZVNupg4u7CmVMU5rCIZFyBAgDbz0qSmKBL3wx/lONO38fXUFpieevdj898GAE8OwQBgAPDkFnjy7Y8IMAB4cgs8+fZHBBgAPKYFPj8/X9PObrfb6zRN33d2uby++XrPP8/z/Ct9//Ly8n46nf7//0ez1sNEgCT4PM8/V4H2xNXQ7j2Dcblc3jQm9J6jWwCS4IV3WwlO6bMA0TMM3QFQeLqX6EdQdAlDFwAEFn0Xhnme/0kv9BAZQgPQm/BbGnoAISQAvQu/FxYSDBEjQigAHlH4EoaIEIQB4OPj422aptzGUdU3+vrSv6dKPfXz5UV7vX15dpDHrmcIqgVnJBDcAVD2+vdpmpYCTPvwJredaW4tUCOA4AqAktcvomsLToWYtHYNGLwhcAFAwetdRD+CQgGG9/P5/IOCzuL15gCs4v8r3Ewo4ff2UBPVPKJBUwAqjBNe+C0M0r22hqAZAEKDdCd8CULxvILV3bSEoAkAEvGnafrRurATpiXyMsn+W0FgDoBg824FEalk5QCuLVpAYApAxA1Xalh9eTSbmAHA3GjXuZ5LBbcTsowEJgBwxffqgbnCaY+/Xq+pHYaOma0gUAdgiM/DhGMvi8JYHYDr9TojJrAiGrl3tDGeEKgCgIa0If5XBBkQqHZJagCgGxjiH8cfDwdSAQAV/3fBo0pvtFCusR4UAq16QAUANO+fz2eV+2kYOvIcIAQqzlQtCOr9WsRGFk5rbeg5gUY6rQYA8X6NhWoZt5d5WjlWFQDIIof4cuRapAIxAIj4aesj78sBSFciEbYmvYoBQBY2vL9O/HQ1WA+IC0IRAIj3D/Hrxc8zIKlAGgXMAJAuSM9sjzOTZRRgAxDZ+zee0uVv6x5haxUFTADwKPyODJRS0SN8yodVFGADQBV/Hrk/clTSTERIFOA6HwsAxNDcBWgYCFlXvo8HoBp7RDsCbu3FAoAi0Mu41Lq2AnitUwMEYK+slpALwN03e3gZFjDKru291lsDAlILcKIADAASZj3C/3paBr+3bs/4vYGgWYfBAFBe5mlEam2Ix3muH1lfOQbYL5wGOACEDP8aEaA0bg8gIGkAjcYQAJHDvzYAab4ezg6oNIDWASoAeHsNEBK5UXYZ772ve4sG9gylAQgA6mbehqLWJ1K/uMh7f3vrB9KAKgB38z8abmqFqDknr713NAgAAKD3YqAR4C4AaMFRK4InABFPEjXqABIAgDQo1FiJb1EEAmsN8aSRSn1IZCYBoDqACKGRMgQgqGiI996pfSPrGwCIpP/7IsTTFG7zZQrKOZFfxCEB0KDMYvPMkzHrJaQPj2z+kTYa6bkaAI+Nb9WkIDVXf71Ba1sMAFbDRwEACbmaMLYCIHQL6NQFHOrYMgoMAOJFgObHx9RZAHVGg9QAIwIw4jbSejGmI4cOAP78+lTVG0JIKzMGDAAYxtIaOgA4tqRGCrjrXS2LngjPAihoKYNT13Nfb5ECBgCgKq3Df6suYAAAAtA6Gg4AArWBrcVPWx/PAoIA4CE+AgCSkshzAA3KwAgqHubYBbi+F4LSRgUAjTwjVha80AGAEJ9uTu0biUxkBAAAgN57BmopGkYZQjTpwUWIV2ne795ctS1gmpsEYH3Y8vRvCk1P+jz+PuERAFqOiQIQuhU0jgChhM9AUPkffTStAgB6M6vQaAVApHC/tR0FALp2CACtcNMRACG9vrQflf9VAYheB2hGANRwVjAj81Len+ZAn0lAEWAFgHrk6tYTKwHgtn5E9HIMAAC8FxgA4KYwddwNU+MrAQgf7rf71wr/cBuYBiJ1AHLwQIkpeV0KQA/hnlv8ccI/C4DIaUAAQHder93+5fngFBA5CjAA6Fb4LJhm+GdHAKQb8DgTQNJTj+HeOvxLAaC6AZdfk7oTBbr3eivvFwGAeJtHFEib2XQqDyP8zt52a2VJlGPVAAWJIaOApIPo4RrE6STiiyIAWgx6RYEeBOWuETmDaQoA2BK61AJc40Yfj4jP7f3LPYtSACMKuJ0ORhcWXR/V9qV5pN4vTgGcWmCkAlTqr+MQ768RvxoApDipJVRuvr6vRMSvCf3ZOuIUkCdAF+r1nKBHDFo6VjUAaEE4UgGOIpL3Nby/OgXkLaHEDghoCNDnGrW5Xy0FcFPBgOAYAjSdaomvFgGYXUFV20L7UJ8jUPG1HUilBhCkggFBwSlDfPVzFVUAOAdEoz38QwCa863spQ5AWiiHaO2Q1lMC8BZfvQYojc+E4KmeG6xd08/f8L8iwGoWfdv7mUQAQWewXGK5UcTQLcZwHcPaJqYACNLBQ0PACfmtHMIcAAkErTbfwuO5hXFek7Xn5/s0AaAGgp7/9Ds317cW37QI3PMubv7zMIhGVJAK7xH5mkUAaWFYCtIqLEohqBF+8UaHPzrRHIBsXG5BtAUh/Xy5XN6kYmleVyu856ePuAEgrQu2wqWo4AGDgughWl9XALQgKGuF9L1F4ZgEX3M0fIBDRJkQv7fgDoBGbXDH0Mvf98uvJzDS96fTafm3/MoC5/+73W6v0zR9X3+GTuzQtBKplgkDgDEIqDbW40J4fbnJcABopwVrRcH5wwmf1x0SgDIapO+naUp5t8evsMJ3AUDHIIQXvisAStdfTxNTcaZamCmEl25ED18DoGIEgGHpMizaTtQGteNC1wCczSUY1nrBMjos7WOkzwzm2Ghv7MMAsLe51Nunfr4AIw/bSx9fzgayd6eL9s4Oao0f4fqHBiCCgaOvYQAQXSHj9Q0AjA0cffoBQHSFjNc3ADA2cPTpBwDRFTJe3wDA2MDRpx8ARFfIeH3/AWxQ99tLVxb5AAAAAElFTkSuQmCC" alt="Play">
      <img v-if="isPlaying==true" src="data:image/png;base64,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" >
      <span v-if="speed != -1" class="speed-text" id="speedValue">{{speed}} km/h</span>
    </button>
    

  </div>
    

</template>


<script setup>
  import { ref, onMounted } from 'vue';
  import ProgressChart from './component/ProgressChart.vue';
  import GpsPathTransfigure from "/index.js"
  import chroma from "chroma-js";
  const segmentInfoData = ref([]);
  // 状态变量：true表示播放，false表示暂停
  let isPlaying = ref(false);
  // 运动速度
  let speed = ref(-1);
  // 平均速度和总里程
  let avgSpeed = ref(0);
  let totalMileage = ref(0);
  //用于可播放的轨迹点
  let playPoints = []
  //播放位置
  let playPosition = ref(0)
  //用于播放的marker点
  var moveMarker = null
  //国际化语言
  let locale = 'en'

  //停留点标注是否可见
  let stopMarker=[]

  const jsApiKey = import.meta.env.VITE_AMAP_JS_API_KEY;
  const webApiKey = import.meta.env.VITE_AMAP_WEB_API_KEY;
  const script = document.createElement('script');
  script.src = `https://webapi.amap.com/maps?v=2.0&key=${jsApiKey}`;
  document.head.appendChild(script);

  /**
   * 拖动进度条时的回调。
   * @param {*} index 轨迹下标
   */
  const handleMove = (index) => {
    if(index>0){
      //隐藏停留点
      hideStopMarker()
      //修改当前显示的marker点
      playPosition.value = index
      var point = playPoints[playPosition.value];
      moveMarker.setPosition([point.lng, point.lat]);
      speed.value = parseInt(point.speed)
      //显示轨迹标注
      moveMarker.show()
    }else{
      //显示停留点标注
      showStopMarker()
      //隐藏轨迹标注
      moveMarker.hide()
    }
    

  };

  /**
   * 切换/暂停轨迹
   */
   function switchPlay(){

        isPlaying.value=!isPlaying.value

        if(isPlaying.value){
          //隐藏停留点
          hideStopMarker()
          //显示渲染轨迹的marker点
          moveMarker.show()

          function sleep(ms) {
              return new Promise(resolve => setTimeout(resolve, ms));
          }


          async function renderNextPoint(points) {
              // 播放完毕后
              if (playPosition.value >= points.length) {
                // 重置播放进度
                playPosition.value=0;
                // 重新显示播放按钮
                isPlaying.value=false
                // 重置速度位初始值-1
                speed.value = -1
                // 隐藏渲染轨迹的标注点
                moveMarker.hide()
                // 显示停留点标注
                showStopMarker()
                return 
              }
              
              var point = points[playPosition.value];
              moveMarker.setPosition([point.lng, point.lat]);
              speed.value = parseInt(point.speed)

              // 等待Nms渲染下一个点
              await sleep(100);

              // 更新 index
              playPosition.value=playPosition.value+1;

              // 递归调用以渲染下一个点
              if(isPlaying.value){
                renderNextPoint(points)
              }
              
          }
          // 开始播放
          renderNextPoint(playPoints);
      }
  }

  function showStopMarker(){
    if(stopMarker.length>0){
      stopMarker.map(item=>{
        item.show()
      })
    }
  }

  function hideStopMarker(){
    if(stopMarker.length>0){
      stopMarker.map(item=>{
        item.hide()
      })
    }
  }

  async function initMap() {
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
          locale:locale,
          aMapKey:webApiKey,
          defaultMapService:'amap',
          openDebug:false,
          pathColorOptimize:true,
          samplePointsNum:300,
        })
        const staticPoints = await GpsPathTransfigure.optimize(pathParam);
        const { finalPoints,trajectoryPoints, stopPoints, center, zoom ,segmentInfo,startPoint,endPoint,avgSpeed: speed_avg,totalMileage: mileage_total} = staticPoints;
        segmentInfoData.value = segmentInfo
        playPoints = finalPoints
        avgSpeed.value = speed_avg
        totalMileage.value = parseFloat(mileage_total/1000).toFixed(2)

        var map = new AMap.Map('amapContainer', {
            resizeEnable: true,
            center:[center.lng,center.lat],
            mapStyle: "amap://styles/macaron",
            zoom:zoom
        });

        for(var i=0;i<stopPoints.length;i+=1){
          var stopPoint = stopPoints[i]
        
          var marker = new AMap.Marker({
            icon: new AMap.Icon({
              image:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAABbElEQVR4AaRTMU4DMRAcW5wSCaTQpSTPyFPSUtBRhJeQgo4iLU+5Z0BJBxJIiUAxM3t3iaN4cwGszHk9uzNeO3cRzkhLDNMjxoYHXCVB63tcJsKR4cAwLRsjfGKMNYaGTq11hREI26BgHLtazUkFnZGIPlQYmSari11siYq7d8SpMzWmbeujZiOqP5hJLFCbeFUKox66E5v/8/huGopJ9+YZJUyxwRPx3GLulerPS+yy6dCrSjQDpll6bsbaKCO3IbuMuMBgS+TBBn43yc9FtYry8A33u96p+Z4eP/Ku9OQo8sArp7p2eNELPQ4wwMrvMKAsAkdEOfeBdcQZ3lEaATW/9AlTubhGwIyc+4vhGqsjxwZNF8SkxYyGtecW7vDWHNnr0lOW+C/YSc0wqMuWKNX2ctQGdqc6M1RgBBOKfwVqTNuKtoZaW4IFinvBVwTneDVNVrxnKF4F4RYvkLEgoRKCYkFGNzTTVYnP8AMAAP//yejrrQAAAAZJREFUAwB+QHGCeIqbugAAAABJRU5ErkJggg==",
              size: new AMap.Size(20, 20),
              imageSize: new AMap.Size(20, 20)
            }),
            position: [stopPoint.lng, stopPoint.lat],
            offset: new AMap.Pixel(-10, -10),
          });
          marker.setMap(map);
          stopMarker.push(marker)
        }

        if(startPoint){
          var marker = new AMap.Marker({
            icon: new AMap.Icon({
              image:"data:image/png;base64,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",
              size: new AMap.Size(32, 32),
              imageSize: new AMap.Size(32, 32)
            }),
            position: [startPoint.lng, startPoint.lat],
            offset: new AMap.Pixel(-16, -32)
          });
          marker.setMap(map);
        }

        if(endPoint){
          var marker = new AMap.Marker({
            icon: new AMap.Icon({
              image:"data:image/png;base64,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",
              size: new AMap.Size(32, 32),
              imageSize: new AMap.Size(32, 32)
            }),
            position: [endPoint.lng, endPoint.lat],
            offset: new AMap.Pixel(-16, -32)
          });
          marker.setMap(map);
        }

        for (var i = 0; i < trajectoryPoints.length; i += 1) {
          let item = trajectoryPoints[i];
          let path = [];
          for (var j = 0; j < item.path.length; j += 1) {
            let point = item.path[j];
            path.push([point.lng, point.lat]);
          }

          if (item.type == 'add' || item.type == 'drift') {
            // 处理虚线部分
            var subLine = new AMap.Polyline({
              path: path,
              strokeColor: '#959595',
              strokeOpacity: 0.8,
              strokeWeight: 3,
              strokeStyle: 'dashed',
              strokeDasharray: [1, 2],
              borderWidth:2,
              zIndex: 50
            });

            map.add(subLine);
          } else {
            // 处理渐变色部分
            let nextItem = trajectoryPoints[i + 1]; // 获取下一个轨迹片段
            let nextColor = nextItem ? nextItem.color : item.color; // 如果没有下一个，则保持当前颜色

            let segmentCount = 10; // 将路径分成10段
            // 使用Chroma.js生成颜色过渡数组
            let gradientColors = chroma.scale([item.color, nextColor?nextColor:'#959595']).colors(segmentCount);

            for (let k = 0; k < segmentCount; k++) {
              let startFactor = k / segmentCount;
              let endFactor = (k + 1) / segmentCount;
              
              let segmentPath = [
                [item.path[Math.floor(startFactor * (item.path.length - 1))].lng, item.path[Math.floor(startFactor * (item.path.length - 1))].lat],
                [item.path[Math.floor(endFactor * (item.path.length - 1))].lng, item.path[Math.floor(endFactor * (item.path.length - 1))].lat]
              ];

              let segmentColor = gradientColors[k]; // 取Chroma.js生成的渐变颜色

              var subLine = new AMap.Polyline({
                path: segmentPath,
                strokeColor: segmentColor,
                strokeWeight: 3,
                isOutline:true,
                outlineColor:'#959595',
                lineJoin: 'round',
                lineCap: 'round',
                zIndex: 50
              });

              // 渲染每个小线段
              map.add(subLine);
            }
          }
        }
        
      //初始化一个用于播放的marker点
      moveMarker = new AMap.Marker({
        icon: new AMap.Icon({
              image:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAAjxJREFUaEPdWlGSwiAMJfUsq73AOvu3ejLXk9n923EvoO5ZLDugMC22JZRXhfZHp6WQl7yEJJQE6CqX6y8zlZTyU/8n2uhfKSvzjIi+RVFUp9OPvRcjAsW8bISWQuxGzSNlRYvFPgbMKABK8NFC9yAlIfany9FakauQIABTCO4KSkWxDbEIG8Dq7f1gOc1Vz9hxUlbnv98t53UvgLL82Mi6PnAmQ4/hWGMQwDMo4wPt841eACkIb0PvgIN3Anglbfos0kenTgCr5Vr6TPuK5+fL8UHehxtPjTahWuiITi0AKVLnYZ9w/KEFIFXquCCaVLIAUoo6PmY1Q6sFkIv2DThjBQ0gB+73+YIGkHTk8WSvNwCJxn2fLyga0VT0UY6mBSiKStT1RldppkLzScZ8rtYgdPQZSr6mWIuQ/PdljjpgAKs5bQEYgIAiBOZzqqZGAeBo31AbZgUNABSBONUTHIDq3MAABHQVkJFvBhQCdhu6Co6ukI7yO9Xxg+4DHEeGObDSDBqAmvPpGxlUI4YvSjP3Jq5KI7SyxvZPB9IKFfnyT+bQ2zszD4sfdt/5bwUNMD+Jl4w3g9k451FS5maFzqI+m8rMyXrbja0MfMFNGufVWjT+j8pQefGEP4rV3E21TxTUXk8tKg3lV/M9YrLlX86HfE33ghUhHJ8N6HB4j1mb6+la9nrdoTtszTU4RZEznqOS9pgpkr9QwY1EQRZwocZaxPRPx3wjAQHg0ss2ce3s7c9tdJV2v2KEbq77D8VaZVwO+X8uAAAAAElFTkSuQmCC",
              size: new AMap.Size(16, 16),
              imageSize: new AMap.Size(16, 16)
          
        }),
        offset: new AMap.Pixel(-8, -8)
      });
      moveMarker.setMap(map);  

    } catch (error) {
        console.error('Fetch error:', error);
    }
  }

  onMounted(async ()=>{
    //由于使用dom加载的地图，这里需要给一点时间让地图加载完成，不然可能会无法初始化地图. 实际开发中不必如此
    setTimeout(function(){
      initMap()
    },1000)
    
  })



 
  
</script>

<style scoped>
.map-legend {
  position: absolute;
  bottom: 100px;
  right: 32px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
  padding: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  z-index: 100;
}

.legend-item {
  margin-bottom: 5px;
}

.legend-item:last-child {
  margin-bottom: 0;
}

.legend-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.legend-value {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}
</style>
