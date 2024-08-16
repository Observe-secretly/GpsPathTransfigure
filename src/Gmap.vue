<template>
    <div class="mapContainer">
        <div id="gmapContainer" style="height: 100vh;" ></div>
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


    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    document.head.appendChild(script);

    const segmentInfoData = ref([]);

    //定义一些常量
    var x_PI = 3.14159265358979324 * 3000.0 / 180.0;
    var PI = 3.1415926535897932384626;
    var a = 6378245.0;
    var ee = 0.00669342162296594323;


    // 坐标系转化方法
function gcj02towgs84 (lng, lat) {
    // 保存原始经纬度的正负标志
    const originalLngSign = Math.sign(lng);
    const originalLatSign = Math.sign(lat);
    lat = Math.abs(lat);
    lng = Math.abs(lng);


        let dlat = transformlat(lng - 105.0, lat - 30.0)
        let dlng = transformlng(lng - 105.0, lat - 35.0)
        let radlat = lat / 180.0 * PI
        let magic = Math.sin(radlat)
        magic = 1 - ee * magic * magic
        let sqrtmagic = Math.sqrt(magic)
        dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * PI)
        dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * PI)
        let mglat = lat + dlat
        let mglng = lng + dlng
        let lngs = lng * 2 - mglng
        let lats = lat * 2 - mglat
        let finalLng = originalLngSign * lngs;
        let finalLat = originalLatSign * lats;
        return [finalLng, finalLat];
    
    
    }
    
    function    out_of_china(lon,lat ) {
    if (lon < 72.004 || lon> 137.8347) {
      return true;
      }
      if (lat < 0.8293 || lat> 55.8271) {
        return true;
        }
        return false;
        }
    
    function transformlat(x, y) {
        let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0;
        ret += (160.0 * Math.sin(y / 12.0 * PI) + 320.0 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0;
        return ret;
        }
    
    function transformlng(x, y) {
        let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0;
        ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0;
        return ret;
        }

  

  

    async function initMap() {
        let response = await fetch('/src/json/gmap.json');
        let data = await response.json();
        let antResults = data; // 将 JSON 数据赋值给 antResults 数组

        // Example usage:
        var pathParam =[]
        for (var i = 0; i <antResults.data[0].locations.length; i++) {
            var item = antResults.data[0].locations[i]
            var wgs84Point = gcj02towgs84(item.longitude1,item.latitude1)
            pathParam[i]={lng: wgs84Point[0],lat: wgs84Point[1],currentTime:item.currentTime}
        }
        GpsPathTransfigure.conf({
            locale:'en',
            gMapKey:apiKey,
            defaultMapService:'gmap',
            pathColorOptimize:true,
        })
        const staticPoints = await GpsPathTransfigure.optimize(pathParam);
        const { finalPoints, stopPoints, trajectoryPoints,center, zoom ,segmentInfo,startPoint,endPoint} = staticPoints;
        segmentInfoData.value = segmentInfo

        const { Map } = await google.maps.importLibrary("maps");
        const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

        let map = new Map(document.getElementById("gmapContainer"), {
            center: { lat: center.lat, lng: center.lng},
            zoom: zoom,
            mapId: "4504f8b37365c3d0",
            mapTypeId: "terrain",
        });

        // 创建带有方向性的轨迹线
        var lineSymbol = {
            path: google.maps.SymbolPath.FORWARD_OPEN_ARROW, // 自定义箭头形状的SVG路径
            scale: 1,
            strokeOpacity: 1,// 透明度
            strokeColor: '#ffffff',
        };

        for(var i=0;i<trajectoryPoints.length;i+=1){
            let item = trajectoryPoints[i]
            
            const flightPath = new google.maps.Polyline({
                path: item.path,
                strokeColor: item.color,
                strokeOpacity: 0.8,
                strokeWeight: 6,
                icons: [
                    {
                    icon: lineSymbol,
                    offset: '0%',
                    repeat: '30px' // 每隔多少px重复显示箭头
                    }
                ]
            });

            flightPath.setMap(map);

      }


        // const flightPath = new google.maps.Polyline({
        //     path: finalPoints,
        //     // strokeColor: item.color,
        //     strokeOpacity: 0.8,
        //     strokeWeight: 6,
        //     icons: [
        //         {
        //         icon: lineSymbol,
        //         offset: '0%',
        //         repeat: '30px' // 每隔多少px重复显示箭头
        //         }
        //     ]
        // });

        // flightPath.setMap(map);



        
        stopPoints.map(item=>{
            const beachFlagImg = document.createElement("img");
            beachFlagImg.src = "data:image/png;base64,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";
            beachFlagImg.style='width:36px;'
            new AdvancedMarkerElement({
                map,
                position: { lat: item.lat, lng: item.lng },
                content: beachFlagImg,
            });
        })




        const startFlagImg = document.createElement("img");
        startFlagImg.src = "data:image/png;base64,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";
        startFlagImg.style='width:36px;'
        new AdvancedMarkerElement({
            map,
            position: { lat: startPoint.lat, lng: startPoint.lng },
            content: startFlagImg,
        });



        const endFlagImg = document.createElement("img");
        endFlagImg.src = "data:image/png;base64,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";
        endFlagImg.style='width:36px;'
        new AdvancedMarkerElement({
            map,
            position: { lat: endPoint.lat, lng: endPoint.lng },
            content: endFlagImg,
        });

    }


    onMounted(async() => {
        initMap()
    })
</script>

