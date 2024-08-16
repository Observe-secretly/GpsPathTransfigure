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
            locale:'zh',
            gMapKey:apiKey,
            defaultMapService:'gmap',
        })
        const staticPoints = await GpsPathTransfigure.optimize(pathParam);
        const { finalPoints, stopPoints, center, zoom ,segmentInfo} = staticPoints;
        segmentInfoData.value = segmentInfo

        const { Map } = await google.maps.importLibrary("maps");
        const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

        let map = new Map(document.getElementById("gmapContainer"), {
            center: { lat: center.lat, lng: center.lng},
            zoom: zoom,
            mapId: "4504f8b37365c3d0",
            mapTypeId: "terrain",
        });

        const flightPath = new google.maps.Polyline({
            path: finalPoints,
            geodesic: true,
            strokeColor: "#FF0000",
            strokeOpacity: 1.0,
            strokeWeight: 2,
        });

        const beachFlagImg = document.createElement("img");
        beachFlagImg.src = "data:image/png;base64,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";
        beachFlagImg.style='width:36px;'

        const beachFlagImgDiv = document.createElement("div");
        beachFlagImgDiv.style='position: relative; transform: translate(-50%, -50%); width: 36px; height: 36px;'
        beachFlagImgDiv.append(beachFlagImg)

        stopPoints.map(item=>{
            new AdvancedMarkerElement({
                map,
                position: { lat: item.lat, lng: item.lng },
                content: beachFlagImgDiv,
            });
        })

        flightPath.setMap(map);
    }


    onMounted(async() => {
        initMap()
    })
</script>

