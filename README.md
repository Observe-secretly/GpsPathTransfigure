# 介绍
专为设备上报的GPS点渲染轨迹而设计。优化GPS坐标轨迹。包括计算停留点、降噪、停留时间、行驶里程、速度等信息

## 高德地图效果
![](/doc/amap_track.gif)

## Google地图效果
![](/doc/gmap_track.gif)


# 插件使用前提
您的GPS点必须是连续上报的。即便停止也要持续定时上报。足够多且连续的坐标点是轨迹渲染出色的前提。插件只是用来辅助解决精度和停留点数据问题

# 核心功能介绍
- 自动识别停留点
- 密集停留点降噪
- 卡片式信息展示
- 噪点平滑处理（需要配置高德密钥。国外需要配置Google Map密钥）
- 使用门槛低
- 支持国际化
- 高灵活性（提供多达20+个参数根据需要自由调整）
- 参数自动优化策略。（根据不同轨迹自适应调整部分参数）
- 根据轨迹自动计算中心点和Zoom缩放比
- 高性能。（异步架构）
- 轨迹采样（为了让不同长度的轨迹渲染时长一致）
- 随速自适应轨迹颜色（根据相对速度的不同，一段轨迹的快慢由蓝色到红色24种颜色标注出来）

# 停留点计算原理
## 理论依据
连续的GPS点中，静止不动的一段或者多段这样的点序列。把这些点序列处理成一个点，也就是拿这些序列的第一个点即可。理论依据如下：从第二个点开始，每个点都和第一个点进行距离计算和比较。至少比较N个点。当百分之M的点距离在X内的话，就继续计算比对。直到后面Z个连续点超出X，那么第一个点到超出X的第一个点，也就是Z的第一个点之前的点认为是静止状态。则这个序列被认为是静止的GPS序列，取停止点的中心点即可。后面从继续从Z的第一个点循环做这件事儿。若点不足N个，则不做任何处理

![stoppoint.png](/doc/stoppoint.png)
在连续的GPS序列中，假设前半段静止，后半段运动。则后序所有点和第一个点进行距离计算后和时间的关系图如上。静止的点拟合后的结果一定是平行于X轴的，后半段的拟合在匀速的情况下，是一个0<角度<90度的线（变速运动的话时拟合的是曲线）

## 停留中心点计算
识别出停留点轨迹序列后，需要计算这些点的中心点，当作停留点。算法如下：
![centerpoint.png](/doc/centerpoint.png)

# 平滑处理补点原理
![smoothness.png](/doc/smoothness.png)
图中绿色的段落会被识别出来，调用地图服务进行补点

- 1、统计相邻两点之间的距离，去掉最大值和最小值（如果有相同的最大/小值一并去掉），统计出平均值。
- 2、若超出平均值一定倍数`smoothnessAvgThreshold`，则判定点距离过远，需要平滑处理
- 3、平滑处理的方式：国内使用高德地图步行路线规划功能补点；国外使用Google道路吸附功能补点
- 4、性能方面也不必担心。插件整体架构使用了异步的方式并发处理这些平滑点。网络（客户端）正常情况下此功能会带来5%～30%的性能损耗。但它依然很快。

# 自动优化
## 什么是自动优化
在开启自动优化`autoOptimize=true`后，插件会根据轨迹的实际情况自动调整停留点的识别精度。避免过于密集的停留点影响查阅轨迹的效果。最终精度大小取决于你的GPS坐标上报的频率和平均误差(偏移)。理论上GPS点约密集且误差在35米内，则自动优化不会触发。
## 自动优化原理
![autoOptimize.png](/doc/autoOptimize.png)
图中圈圈表示为停留点范围。

- 1、统计停留点之间互相进行比对。计算相距最近的停留点距离（红色部分）是否小于等于distanceThreshold(绿色部分)；
- 2、若相距较近的点数量占总停留点数的比例超过20%，则扩大distanceThreshold参数和stationaryEndPoints参数重新进行评估计算；
- 3、最大评估autoOptimizeMaxCount次；
- 4、性能：评估过程不会进行多余的网路操作，仅带来极小的CPU计算开销


# 二次开发与测试
// TODO

# 插件使用
## 安装
``` shell
npm install gpspathtransfigure
```
## 引用
``` javascript
import GpsPathTransfigure from "gpspathtransfigure"
```
## 配置
|配置|类型|默认值|自动优化|备注|
|--|--|--|--|--|
|minComparisonPoints |`Number`| 10|| 最少比较的点数 |
|distanceThresholdPercentage |`Number`| 70|| 距离阈值内的点的`百分比` |
|distanceThreshold |`Number`| 35|`是`| 距离阈值，单位为`米` |
|stationaryEndPoints |`Number`| 10|`是`| 判断静止状态结束的连续点数 |
|autoOptimize |`Boolean`| true|| 是否开启参数自动优化 |
|autoOptimizeMaxCount |`Number`| 10||自动优化调整次数上限|
|proximityStopThreshold|`Number`|35|| 近距离停留点距离阈值。此值通常要大于等于distanceThreshold|
|proximityStopTimeInterval|`Number`|60||近距离停留点时间间隔阈值。单位`分钟`|
|proximityStopMerge|`Boolean`|true|| 近距离停留点合并。建议默认开启|
|smoothness|`Boolean`|true||是否开启停留点前后点位的平滑过度。你必须配置对应的地图密钥。否则无效。开启此项会额外消耗移动端流量，并且轨迹渲染速度也会降低|
|smoothnessAvgThreshold|`Number`|1.6||平滑过度距离倍数阈值。点之间的距离超过平均值的这个倍数后，才会被捕捉到进行平滑处理|
|aMapKey|`String`||| 配置高德地图可以调用路线规划的`Web服务密钥`。平滑过度时使用|
|gMapKey|`String`||| 配置google地图`密钥`。平滑过度时使用|
|defaultMapService|`String`||| 默认地图服务。枚举值【amap】【gmap】。配置后将会强制使用相应的地图服务。不配置，则默认语言是zh时使用amap。其它语言都使用googleMap|
|format |`Boolean`| true||是否格式化数据内容。如里程、时间信息。若开启则根据locale配置输出对应国家语言的信息的内容|
|locale |`String`| zh||设置语言|
|timeformat|`String`|yyyy-MM-dd HH mm:ss||指定时间格式化方式|
|mapWidth|`Number`|1024||地图容器的宽度。单位`px`。zoom计算时使用|
|mapHeight|`Number`|768||地图容器的高度。单位`px`。zoom计算时使用|
|defaultZoom|`Number`|16||默认地图缩放比。如果无法根据轨迹计算出缩放比，则使用此值|
|pathColorOptimize|`Boolean`|true||是否开启轨迹颜色美化|
|speedColors|`Array`| `["#3366FF", "#3369FF", "#336CFF", "#336FFF", "#3372FF", "#3375FF","#3399FF", "#33A3FF", "#33ADFF", "#33B7FF", "#33C1FF", "#33CCFF", "#66FF00", "#7FFF00", "#99FF00", "#B2FF00", "#CCFF00", "#E6FF00", "#FFCC00", "#FF9933", "#FF9966", "#FF6633", "#FF3300", "#FF0000"]`||速度由慢到快的24级颜色代码|
|samplePointsNum|`Number`|200||轨迹采样数。用于控制返回值samplePoints的长度。samplePoints用于渲染轨迹使用|

## 使用案例(Vue3)
``` javascript
<script setup>
  import { onMounted } from "vue";
  import GpsPathTransfigure from "gpspathtransfigure"
......

onMounted(async ()=>{
    var gpsPoint =[
    ......
    {lon: 14.3908478, lat: 38.3038816, currentTime: '2024-06-27 01:43:36'},
    {lon: 114.3908478, lat: 38.3038816, currentTime: '2024-06-27 01:46:35'},
    {lon: 114.3906792, lat: 38.3037608, currentTime: '2024-06-27 01:47:50'},
    {lon: 114.3906634, lat: 38.3037528, currentTime: '2024-06-27 01:47:55'},
    ......
    ]

    GpsPathTransfigure.conf({
      locale:'zh',
      aMapKey:webApiKey,
      defaultMapService:'amap',
      openDebug:false,
      pathColorOptimize:true,
      samplePointsNum:300
    })

  const staticPoints = await GpsPathTransfigure.optimize(pathParam);
    const { finalPoints, stopPoints,trajectoryPoints, center, zoom ,segmentInfo,startPoint,endPoint,samplePoints} = staticPoints;

    ......
}
......
</script>
```
请注意，在使用此插件时需要异步引用。代码中直接使用finalPoints渲染轨迹即可。若想要渲染停留点标注效果，则渲染所有的stopPoints。渲染带颜色的轨迹请使用trajectoryPoints渲染。高德地图和Google地图的渲染案例请查阅Amap.vue/Gmap.vue源码


## 进度条使用方法
``` javascript
<template>
......
<ProgressChart :data="playPoints" :onMove="handleMove" :setPosition="playPosition" sliderImage="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAASBJREFUaEPtltENgkAQRO/q0H6oRNsQ29BK6EfrwGBi4gey9zIsCXH85bG3s7NyU8vOf3Xn/RcLOJ6HfhzLZXKy1nJ93Lp+yVXKRxsiOfDdzOegJRGUj5p/D60F+sUcTsM49+x572brUr6lt/8WQFeC8ukOTAfQPyXlIxHSCkXFt3huAVtMeekMO2AHxAnIK0Q/i5SP9EkC6MVE+ah5ZyEaziif7gBdCcqnC3AWahlxwEhfoRXOl0tYgDxCsYAdEAcovy47QLMN5SOFkgB6MVE+at5ZiGYbyqc7QFeC8ukCnIVaRuwstMKUMktI90BmY621LaB1Ulmc7ADNNpSPhEsC6MVE+ah5ZyGabSif7gBdCcqnC3AWahmxs9AKU8os8QK/SiBAyMIBIAAAAABJRU5ErkJggg==" />
......
</template>
<script setup>
import ProgressChart from 'gpspathtransfigure/src/component/ProgressChart.vue';

  //用于可播放的轨迹点
  let playPoints = []
  //播放位置。这里是轨迹点的下标。修改后可反响控制进度条进度
  let playPosition = ref(0)

  /**
   * 拖动进度条时的回调。
   * @param {*} index 轨迹下标
   */
  const handleMove = (index) => {
  //在这里处理回调。index是轨迹数据下标
  };

</script>
```
项目中Amap.vue有完整的使用案例

## 返回值说明
|返回值|含义|
|--|--|
|finalPoints|轨迹。格式[{lon: xx, lat: xx, currentTime: xx}]，若坐标点中出现`type: 'add'`则代表此点是噪点平滑处理时的补点|
|stopPoints|停留点。格式[{lon: xx, lat: xx, currentTime: xx}]|
|trajectoryPoints|颜色渲染后的轨迹信息|
|center|中心点。格式{lon: xx, lat: xx, currentTime: xx}|
|zoom|缩放比|
|segmentInfo|分段信息|
|startPoint|开始点|
|endPoint|结束点|
|samplePoints|轨迹抽样数据（固定数量）|


# 问题交流反馈或issues
 QQ：914245697