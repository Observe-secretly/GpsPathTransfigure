<template>
<div id="gmap"></div>
</template>
<script setup>
    import { onMounted } from "vue";
    import "https://maps.googleapis.com/maps/api/js?key=[您的key]"
    import GpsPathTransfigure from "/index.js"
  

    async function initMap() {
        let response = await fetch('/src/json/gmap.json');
        let data = await response.json();
        let antResults = data; // 将 JSON 数据赋值给 antResults 数组

        // Example usage:
        var pathParam =[]
        for (var i = 0; i <antResults.data[0].locations.length; i++) {
            var item = antResults.data[0].locations[i]
            pathParam[i]={lng: item.longitude1,lat: item.latitude1,currentTime:item.currentTime}
        }
        GpsPathTransfigure.conf({
            locale:'zh',
            gMapKey:'您的key',
            defaultMapService:'gmap',
            proximityStopMerge:true,
            smoothness:true,
        })
        const staticPoints = await GpsPathTransfigure.optimize(pathParam);
        const finalPoints = staticPoints.finalPoints
        const stopPoints = staticPoints.stopPoints



        const { Map } = await google.maps.importLibrary("maps");
        const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

        let map = new Map(document.getElementById("gmap"), {
            center: { lat: finalPoints[0].lat, lng: finalPoints[0].lng},
            zoom: 18,
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

