<template>
<div id="gmap"></div>
</template>
<script setup>
    import { onMounted } from "vue";
    import "https://maps.googleapis.com/maps/api/js?key=AIzaSyC0-QkuR8XeQ4XF8yQfj6goHOmI_9awtPU"
    import GpsPathTransfigure from "/index.js"

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
            gMapKey:'AIzaSyC0-QkuR8XeQ4XF8yQfj6goHOmI_9awtPU',
            defaultMapService:'gmap',
        })
        const staticPoints = await GpsPathTransfigure.optimize(pathParam);
        const finalPoints = staticPoints.finalPoints
        const stopPoints = staticPoints.stopPoints
        const center = staticPoints.center
        const zoom = staticPoints.zoom

        const { Map } = await google.maps.importLibrary("maps");
        const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

        let map = new Map(document.getElementById("gmap"), {
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

        beachFlagImg.src =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAhFJREFUWEell0tywjAMhuUwZXqJMl3CKQonK5yM9BSw7NBLdOgQM1Ki1HH0sCErILb49PAvOUDFc3p/3eLycLt90rYQthBjG0P4ou9N026+f9sKkxBKF59Wy30A6P/YeCLAYXO57r11/N4FQK/JY/S24ikFMQFKvda4YtPsvJSYAOfVMs6MpzlPXoYYP6QoeRAqgOa9ZVDcE2O7/vnbaVESASjvXXeUNqUAfCrSMEt7LWgZwKh4Npb/UVp057eX4yQdRhREgJmBJBQaAOoBh/p5AKn4BggVAADWlys5JNUCv8vTKkfgAYA0BRKAVgdPAUDX9eKUSbB0fOsikBeRUAPasRLrp7YIS48hQ0yalCDZliyrQiSqIABYRahFRQs/NVRtk6eEVpRSm15Tqu4FtRGwvDcjQOdZkOQaAM97FwAX5FVdDOA0obqBJGlM6BWRK+2XDXttuBhAk1ZrOCoJfRWAlAoVoDD01QAEYfQINuhVfVEzUrXBGFRwT03oiyLAEstNB8dtVaCGcRzfs/GS8VwfyYRRnD3MIbTfCWQYYjWYGYA0zdDNp2noxsPz37guKTqKGLfoXuf/LzIIslgc8jF9AjB6pizOawPXe2Emm6wZwgmZAKReodeecUsL0lbNNyupSMtTgBazNKQAY8Hij123nSmlog/6WO5IbYn3DxWhlOdR++mDckmNcbyWS0WrAd8B+JXLMMpEbqAAAAAASUVORK5CYII=";


        stopPoints.map(item=>{
            new AdvancedMarkerElement({
                map,
                position: { lat: item.lat, lng: item.lng },
                content: beachFlagImg,
            });
        })

        flightPath.setMap(map);
    }


    onMounted(async() => {
        initMap()
    })
</script>

