import {getI18nValue} from  "./lang/i18n"
import  moment from "moment"

//参数自动优化次数
let autoOptimizeCount = 0

//配置文件
var config={
    minComparisonPoints : 10, // 最少比较的点数
    distanceThresholdPercentage : 70, // 距离阈值内的点的百分比
    distanceThreshold : 35, // 距离阈值，单位为米
    stationaryEndPoints : 10, // 判断静止状态结束的连续点数
    autoOptimize : true, // 是否开启参数自动优化
    autoOptimizeMaxCount : 10,//自动优化调整次数
    IQRThreshold:1.5,// 异常值检测阈值。此值通常要大于等于1.5

    proximityStopThreshold:45,// 近距离停留点距离阈值。此值通常要大于等于distanceThreshold
    proximityStopTimeInterval:60,//近距离停留点时间间隔阈值。单位分钟
    proximityStopMerge:true,// 近距离停留点合并。建议默认开启
    
    smoothness:false,//是否开启停留点前后点位的轨迹补偿。你必须配置对应的地图密钥。否则无效。开启此项会额外消耗移动端流量，并且轨迹渲染速度也会降低
    smoothnessAvgThreshold:1.6,//轨迹补偿距离倍数阈值。点之间的距离超过平均值的这个倍数后，才会被捕捉到进行轨迹补偿
    smoothnessLimitAvgSpeed:40,//开启轨迹补偿的最高平均速度。轨迹平均速度必须低于此值才会启用轨迹补偿
    aMapKey:'',// 配置高德地图可以调用jsapi路线规划的密钥
    gMapKey:'',// 配置google地图密钥
    defaultMapService:'',// 默认地图服务。枚举值【amap】【gmap】。不配置则默认语言是zh时使用amap。其它语言都适用googleMap
    
    format : true,//是否格式化数据内容。如里程、时间信息。若开启则根据locale配置输出对应国家语言的信息的内容
    locale : 'zh',//设置语言
    timeformat:'YYYY-MM-DD HH:mm:ss',//指定时间格式化方式
    mapWidth:1024,//地图容器的宽度
    mapHeight:768,//地图容器的高度
    defaultZoom:16,//默认地图缩放比。如果无法根据轨迹计算出缩放比，则使用次值
    pathColorOptimize:true,//是否开启轨迹颜色美化
    speedColors : [
      "#3366FF", "#3369FF", "#336CFF", "#336FFF", "#3372FF", "#3375FF",
      "#3399FF", "#33A3FF", "#33ADFF", "#33B7FF", "#33C1FF", "#33CCFF", 
      "#66FF00", "#7FFF00", "#99FF00", "#B2FF00", "#CCFF00", "#E6FF00", 
      "#FFCC00", "#FF9933", "#FF9966", "#FF6633", "#FF3300", "#FF0000"
    ]
    ,//速度由慢到快的24级颜色代码。
    samplePointsNum:200,//轨迹采样数。用于控制返回值samplePoints的长度。samplePoints用于渲染轨迹使用

    useUniApp:false,//此处如果为true，则代表使用uniapp环境，一些网络请求会以uniapp的方式进行调用
    openDebug:false,//开启调试后打印调试信息
}


/**
 * 计算两个点之间的距离
 * @param {*} point1 
 * @param {*} point2 
 * @returns 距离。单位米
 */
function calculateDistance(point1, point2) {
  // 使用Haversine公式计算两个GPS点之间的距离
  const R = 6371e3; // 地球半径，单位为米
  const lat1 = point1.lat * Math.PI / 180; // 第一个点的纬度转换为弧度
  const lat2 = point2.lat * Math.PI / 180; // 第二个点的纬度转换为弧度
  const deltaLat = (point2.lat - point1.lat) * Math.PI / 180; // 纬度差转换为弧度
  const deltaLng = (point2.lng - point1.lng) * Math.PI / 180; // 经度差转换为弧度

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2); // Haversine公式的中间变量
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); // Haversine公式的另一个中间变量


  return (R * c).toFixed(2); // 计算最终距离，单位为米，并保留两位小数
}

//格式化距离
function formatDistance(meters) {
    // 定义单位
    const oneKilometer = 1000;
    // 如果小于1000米，显示多少米
    if (meters < oneKilometer) {
        return `${meters.toFixed(2)}${getI18nValue(config.locale,'meter')}`;
    }

    // 如果大于等于1000米，显示多少公里
    let kilometers = meters / oneKilometer; // 保留两位小数
    return `${kilometers.toFixed(2)}${getI18nValue(config.locale,'kilometer')}`;
}
// noiseRecognitionDistance
function noiseRecognitionFilter(points) {
  if (points.length <= 2) {
      return points; // 如果点太少，无法计算平均值，直接返回
  }

  // 提取所有经纬度
  const latitudes = points.map(point => point.lat);
  const longitudes = points.map(point => point.lng);

  // 计算最大值和最小值
  const maxLat = Math.max(...latitudes);
  const minLat = Math.min(...latitudes);
  const maxLng = Math.max(...longitudes);
  const minLng = Math.min(...longitudes);

  // 计算平均值，去掉最大和最小
  const avgLat = (latitudes.reduce((sum, lat) => sum + lat, 0) - maxLat - minLat) / (latitudes.length - 2);
  const avgLng = (longitudes.reduce((sum, lng) => sum + lng, 0) - maxLng - minLng) / (longitudes.length - 2);

  // 计算阈值，考虑正负
  const latThreshold = Math.abs(avgLat * 0.5);
  const lngThreshold = Math.abs(avgLng * 0.5);

  // 过滤点，去掉超出范围的点
  const filteredPoints = points.filter(point => {
      const isLatValid = point.lat >= (avgLat - latThreshold) && point.lat <= (avgLat + latThreshold);
      const isLngValid = point.lng >= (avgLng - lngThreshold) && point.lng <= (avgLng + lngThreshold);
      return isLatValid && isLngValid;
  });

  return filteredPoints;
}

/**
 * 寻找停留点
 * @param {*} gpsPoints 
 * @returns 
 */
async function optimize(gpsPoints) {
  //去除噪点 
  let newGpsPoints = noiseRecognitionFilter(gpsPoints)
  
  if(config.autoOptimize){
    //反复渲染轨迹时，为了确保自动优化每次都生效，需要重置自动优化次数
    autoOptimizeCount = 0
    //自动优化的配置项重置
    config.distanceThreshold = 35
    config.stationaryEndPoints = 10
  }
  
  return  innerOptimize(newGpsPoints)
}

/**
 * 寻找停留点
 * @param {*} gpsPoints 
 * @returns 
 */
async function innerOptimize(gpsPoints) {
  var finalPoints = []; // 存储最终的轨迹点

  let N=config.minComparisonPoints 
  let M=config.distanceThresholdPercentage
  let X=config.distanceThreshold
  let Z=config.stationaryEndPoints

  let i = 0;

  while (i < gpsPoints.length) {
    let countWithinThreshold = 0; // 记录在距离阈值内的点的数量
    let j = i + 1;

    // 从第i个点开始，比较后续的N个点
    for (; j < gpsPoints.length && j < i + N; j++) {
      if (calculateDistance(gpsPoints[i], gpsPoints[j]) <= X) {
        countWithinThreshold++; // 统计在距离阈值X内的点的数量
      }
    }

    // 如果在N个点中有至少M%的点在距离阈值内
    if (countWithinThreshold / N >= M / 100) {
      let staticEndIndex = i + N; // 静止状态的结束索引初始值
      const staticPointsSequence = gpsPoints.slice(i, i + N);

      // 检查后续点，直到找到连续Z个点超出距离阈值X
      while (staticEndIndex < gpsPoints.length) {
        let outOfThresholdCount = 0; // 记录超出阈值的点的数量
        for (let k = staticEndIndex; k < staticEndIndex + Z && k < gpsPoints.length; k++) {
          if (calculateDistance(gpsPoints[i], gpsPoints[k]) > X) {
            outOfThresholdCount++;
          }
        }

        // 如果连续Z个点中有Z个点超出距离阈值X，则认为静止状态结束
        if (outOfThresholdCount >= Z) {
          break;
        }

        staticPointsSequence.push(gpsPoints[staticEndIndex]);
        staticEndIndex++;
      }
      const centerPoint = calculateGeographicalCenter(staticPointsSequence);//这个中心点就是质心。是停留点
      finalPoints.push(centerPoint); // 将中心点加入结果数组
      i = staticEndIndex; // 跳到静止状态结束的点继续处理
    } else {
      finalPoints.push(gpsPoints[i]); // 非静止状态点，直接加入结果数组
      i++; // 不满足静止条件，继续检查下一个点
    }
  }

  //是否合并相距较近的停留点
  if(config.proximityStopMerge){
    finalPoints  = proximityStopMerge(finalPoints)
  }
  
  //把停留点从坐标中单独提出来
  let stopPoints = []
  stopPoints = dismantleStopPoint(finalPoints)

  if(config.autoOptimize){
    if(autoAdjustThreshold(stopPoints) && autoOptimizeCount < config.autoOptimizeMaxCount){
      autoOptimizeCount+=1
  
      config.distanceThreshold= config.distanceThreshold+5
      config.stationaryEndPoints = config.stationaryEndPoints+3
  
      if(config.openDebug){
        console.log(`第${autoOptimizeCount}次优化`)
        console.log(config.distanceThreshold,'距离阈值')
        console.log(config.stationaryEndPoints,'静止状态结束的连续点数')
      }
  
      return innerOptimize(gpsPoints)
    }
  }

  //计算速度和里程
  let totalMileage = await calculateSpeedAndMileage(finalPoints)
  let avgSpeed = await calculateAvgSpeed(finalPoints)

    // 停留点前后点位的轨迹补偿（需要使用API调用地图能力进行，会产生额外的费用）
  if(config.smoothness && finalPoints.length>3){
    //如果平均速度高于15公里（缺省值）每小时，则不进行轨迹补偿过渡。过快的速度在进行轨迹补偿时会和实际轨迹相差巨大
    if(avgSpeed<config.smoothnessLimitAvgSpeed){
      finalPoints = await smoothness(finalPoints)
    }
  }

  //找到里程异常大的点。剔除它。
  //核心的作用是剔除轨迹中的极端偏移毛刺。
  let mileageOutliers = detectMileageOutliers(finalPoints,config.IQRThreshold)
  // 过滤掉里程小于distanceThreshold*2的异常点下标
  mileageOutliers = mileageOutliers.filter(index => {
    return finalPoints[index].mileage > config.distanceThreshold * 2
  })
  if(mileageOutliers.length>0){
    finalPoints = removeIndices(finalPoints,mileageOutliers)
  }

  // 初始化轨迹渲染点数组
  let trajectoryPoints = []
  // 对轨迹进行颜色渲染。根据轨迹的速度不同，自适应颜色进行渲染
  if(config.pathColorOptimize && finalPoints.length>0){
    trajectoryPoints = await processTrajectory(finalPoints)
  }

  //因为剔除了异常点所以要再次计算速度和里程。
  totalMileage = await calculateSpeedAndMileage(finalPoints)

  //再次找到里程异常大的点。对完整的finalPoints轨迹进行切割
  //某些偏移是行经中某一段信号丢失（隧道没信号、设备重启等）导致的点跨越极大的距离导致。这时删除不能解决问题。而是拆分轨迹。进行分别渲染或者虚化渲染
  let mileageOutliersCut = detectMileageOutliers(finalPoints,config.IQRThreshold)
  //根据mileageOutliersCut异常点下标把finalPoints切割成一个包含多个轨迹段的二维数组。
  let finalPointsSegments= []
  let trajectoryPointsSegments=[]
  if(mileageOutliersCut.length>0){//存在异常点
    finalPointsSegments = splitTrajectoryByOutliers(finalPoints, mileageOutliersCut);
    //分别计算每个轨迹的颜色渲染轨迹
    for (let i = 0; i < finalPointsSegments.length; i++) {
      let trajectoryPointsSegment = await processTrajectory(finalPointsSegments[i])
      trajectoryPointsSegments.push(trajectoryPointsSegment)
    }
  }

  //如果不存在异常点，就把finalPoints作为一个轨迹段
  if(finalPointsSegments.length==0){//若不存在异常点，就把finalPoints作为一个轨迹段
    finalPointsSegments.push(finalPoints)
    trajectoryPointsSegments.push(trajectoryPoints)
  }

  //基于finalPointsSegments和trajectoryPointsSegments把轨迹再次拼接起来刷新finalPoints完整轨迹
  //目的是通过IQR去除异常点后，需要对完整轨迹进行刷新保证后面计算的平均速度和总里程更加准确
  const mergedTrajectories = mergeTrajectorySegments(finalPointsSegments, trajectoryPointsSegments);
  finalPoints = mergedTrajectories.finalPoints;
  trajectoryPoints = mergedTrajectories.trajectoryPoints;

  // 重新计算平均速度和总里程
  if(finalPointsSegments.length>1){
    avgSpeed = await calculateAvgSpeed(finalPoints)
    totalMileage = await calculateSpeedAndMileage(finalPoints)
  }

  // 返回处理后的轨迹点数组
  return {
    "finalPoints": finalPoints,//优化后的轨迹
    "trajectoryPoints":trajectoryPoints,//优化后根据速度进行拆分的轨迹信息
    "finalPointsSegments": finalPointsSegments,//优化后的轨迹。（根据异常点进行切割的多段轨迹）
    "trajectoryPointsSegments":trajectoryPointsSegments,//优化后根据速度进行拆分的轨迹信息。（根据异常点进行切割的多段轨迹）
    "stopPoints" : stopPoints,//所有的停留点
    "center":calculateCentroid(finalPoints),//中心点
    'zoom':calculateZoom(calculateBoundingBox(finalPoints), config.mapWidth, config.mapHeight),//缩放比
    "segmentInfo":generateSegmentInfo(finalPoints),//分段信息
    "startPoint":finalPoints[0],//开始点
    "endPoint":finalPoints[finalPoints.length-1],//结束点
    "samplePoints":samplePoints(finalPoints),//轨迹抽样数据（固定数量）
    "avgSpeed":avgSpeed,
    "totalMileage":totalMileage
  }; 
}

/**
 * 合并轨迹段并添加连接线
 * @param {Array<Array>} finalPointsSegments - 轨迹点段二维数组
 * @param {Array<Array>} trajectoryPointsSegments - 轨迹渲染段二维数组
 * @returns {Object} - 包含合并后的finalPoints和trajectoryPoints
 */
function mergeTrajectorySegments(finalPointsSegments, trajectoryPointsSegments) {
  let finalPoints = [];
  let trajectoryPoints = [];
  
  if (finalPointsSegments.length > 1) { // 大于1说明轨迹存在多段
    // 合并finalPoints并添加连接线
    for (let i = 0; i < finalPointsSegments.length; i++) {
      let afterPathSegmentPath = finalPointsSegments[i-1];
      let currentPathSegmentPath = finalPointsSegments[i];
      
      if (i > 0 && i < finalPointsSegments.length - 1) {
        // 构造虚线连接相邻段
        let driftPath = [
          {
            lng: afterPathSegmentPath[afterPathSegmentPath.length-1].lng,
            lat: afterPathSegmentPath[afterPathSegmentPath.length-1].lat
          },
          {
            lng: currentPathSegmentPath[0].lng,
            lat: currentPathSegmentPath[0].lat
          }
        ];
        // 注意：这里原代码有bug，应该是push而不是concat
        finalPoints = finalPoints.concat(driftPath);
      }
      finalPoints = finalPoints.concat(currentPathSegmentPath);
    }

    // 合并trajectoryPoints并添加连接线
    for (let i = 0; i < trajectoryPointsSegments.length; i++) {
      let afterPathSegment = trajectoryPointsSegments[i-1];
      let currentPathSegment = trajectoryPointsSegments[i];
      
      if (i > 0 && i < trajectoryPointsSegments.length - 1) {
        let afterPath = afterPathSegment[afterPathSegment.length-1].path;
        let currentPath = currentPathSegment[0].path;
        
        // 构造虚线连接相邻段
        let driftPath = [
          {
            lng: afterPath[afterPath.length-1].lng,
            lat: afterPath[afterPath.length-1].lat
          },
          {
            lng: currentPath[0].lng,
            lat: currentPath[0].lat
          }
        ];
        
        let driftPathSegment = {
          path: driftPath,
          type: 'drift'
        };
        
        trajectoryPoints.push(driftPathSegment);
      }
      trajectoryPoints = trajectoryPoints.concat(currentPathSegment);
    }
  } else if (finalPointsSegments.length === 1) {
    // 如果只有一段，直接使用
    finalPoints = finalPointsSegments[0];
    trajectoryPoints = trajectoryPointsSegments[0];
  }
  
  return { finalPoints, trajectoryPoints };
}

/**
 * 根据异常点下标将轨迹切割成多个段
 * @param {Array} points - 轨迹点数组
 * @param {Array<number>} outlierIndices - 异常点的下标数组
 * @returns {Array<Array>} - 切割后的轨迹段二维数组
 */
function splitTrajectoryByOutliers(points, outlierIndices) {
  let segments = [];
  
  if (outlierIndices.length > 0) {
    // 按照索引从小到大排序
    outlierIndices.sort((a, b) => a - b);
    
    // 第一段：从开始到第一个异常点
    segments.push(points.slice(0, outlierIndices[0] + 1));
    
    // 中间段：从一个异常点到下一个异常点
    for (let i = 0; i < outlierIndices.length - 1; i++) {
      segments.push(points.slice(outlierIndices[i] + 1, outlierIndices[i + 1] + 1));
    }
    
    // 最后一段：从最后一个异常点到结束
    segments.push(points.slice(outlierIndices[outlierIndices.length - 1] + 1));
  } else {
    // 如果没有异常点，整个轨迹作为一段
    segments.push(points);
  }
  
  // 过滤掉长度小于等于3的轨迹段
  segments = segments.filter(segment => segment.length > 3);
  return segments;
}

/**
 * 从原数组中剔除指定下标的元素
 * @param {Array} arr - 原数组
 * @param {Array<number>} indicesToRemove - 要移除的下标数组
 * @returns {Array} - 新数组（不包含指定下标的元素）
 */
function removeIndices(arr, indicesToRemove) {
  const removeSet = new Set(indicesToRemove);
  return arr.filter((_, index) => !removeSet.has(index));
}

/**
 * 检测 GPS 数据中 mileage 异常大的点
 * @param {Array} data - GPS 点数组，每个对象包含 lat, lng, currentTime, speed, mileage
 * @param {number} k - IQR 阈值倍数（默认 1.5）
 * @returns {Array<number>} - 异常点的下标数组
 */
function detectMileageOutliers(data, k = 1.5) {
  const mileages = data.map(p => p.mileage).filter(m => m != null);

  if (mileages.length < 4) return [];

  const sorted = [...mileages].sort((a, b) => a - b);

  const q1 = percentile(sorted, 25);
  const q3 = percentile(sorted, 75);
  const iqr = q3 - q1;
  const threshold = q3 + k * iqr;

  return data
    .map((point, index) => (point.mileage > threshold ? index : -1))
    .filter(index => index !== -1);
}

/**
 * 百分位数计算（线性插值）
 * @param {Array<number>} sortedNums - 升序数组
 * @param {number} p - 百分位（0-100）
 * @returns {number}
 */
function percentile(sortedNums, p) {
  const n = sortedNums.length;
  const rank = (p / 100) * (n - 1);
  const lower = Math.floor(rank);
  const upper = lower + 1;
  const weight = rank - lower;

  if (upper >= n) return sortedNums[lower];
  return sortedNums[lower] * (1 - weight) + sortedNums[upper] * weight;
}

/**
 * 计算两个GPS点之间的方向角（以正北为0度，顺时针方向）
 * @param {Object} point1 起始点 {lat, lng}
 * @param {Object} point2 目标点 {lat, lng}
 * @returns {Number} 方向角（度），范围0-360
 */
function calculateBearing(point1, point2) {
  const lat1 = degreesToRadians(point1.lat);
  const lat2 = degreesToRadians(point2.lat);
  const deltaLng = degreesToRadians(point2.lng - point1.lng);
  
  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
  
  let bearing = Math.atan2(y, x);
  bearing = radiansToDegrees(bearing);
  
  // 转换为0-360度范围
  return (bearing + 360) % 360;
}

/**
 * 根据起始点、方向角和距离计算目标点坐标
 * @param {Object} startPoint 起始点 {lat, lng}
 * @param {Number} bearing 方向角（度）
 * @param {Number} distance 距离（米）
 * @returns {Object} 目标点坐标 {lat, lng}
 */
function calculateDestinationPoint(startPoint, bearing, distance) {
  const R = 6371e3; // 地球半径（米）
  const lat1 = degreesToRadians(startPoint.lat);
  const lng1 = degreesToRadians(startPoint.lng);
  const bearingRad = degreesToRadians(bearing);
  
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distance / R) +
    Math.cos(lat1) * Math.sin(distance / R) * Math.cos(bearingRad)
  );
  
  const lng2 = lng1 + Math.atan2(
    Math.sin(bearingRad) * Math.sin(distance / R) * Math.cos(lat1),
    Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2)
  );
  
  return {
    lat: radiansToDegrees(lat2),
    lng: radiansToDegrees(lng2)
  };
}

/**
 * 计算停留点之间距离最近的另一个停留点距离小于distanceThreshold的占比
 * @param {Array} stopPoints - 包含停留点坐标的数组，每个坐标是一个对象，具有lat和lng属性
 * @returns {Boolean} - 若占比超过一定值则返回true，否则返回false
 */
function autoAdjustThreshold(stopPoints) {
  if (!stopPoints || stopPoints.length === 0) {
      return false;
  }

  const thresholdDistance = config.distanceThreshold; // 距离阈值，单位：米
  const thresholdRatio = 0.2; // 占比阈值

  let closePointsCount = 0;

  for (let i = 0; i < stopPoints.length; i++) {
      let hasClosePoint = false;
      for (let j = 0; j < stopPoints.length; j++) {
          if (i !== j) {
              const distance = calculateDistance(stopPoints[i], stopPoints[j]);
              if (distance <= thresholdDistance) {
                  hasClosePoint = true;
                  break;
              }
          }
      }
      if (hasClosePoint) {
          closePointsCount++;
      }
  }

  const ratio = closePointsCount / stopPoints.length;

  return ratio > thresholdRatio;
}

/**
 * 轨迹补偿
 * @param {*} points 
 */
async function smoothness(points){
  let mapService = config.defaultMapService;
  if(mapService){
    switch (mapService) {
      case 'amap':
         mapService = 'amap'
        break;
      case 'gmap':
        mapService = 'gmap'
        break;
      default:
        mapService = ''
        break;
    }
  }
  
  if(!mapService){
    //根据语言进行选择
    if(config.locale == 'zh'){
      mapService = 'amap'
    }else{
      mapService = 'gmap'
    }
  }

  //判定对应的map是否有配置密钥
  if(mapService =='amap'&&!config.aMapKey){
    return points
  }else if(mapService =='gmap'&&!config.gMapKey){
    return points
  }

  return await smoothnessOptimize(points,mapService)
     
}

/**
 * 轨迹补偿处理
 * @param {*} points 
 * @param {*} mapService 
 */
async function smoothnessOptimize(points,mapService){
  //去掉最大值最小值后，统计距离平均值。
  let avgDistance = calculateAverageDistance(points)
  
  // 把距离高于平均值的GPS点。记录下来
  let optimizePointsIndex = recordIndices(points,avgDistance)

  //optimizePointsIndex的长度代表需要调用多少次地图服务商接口规划路径。
  //所以这里要控制调用的最大次数，控制性能
  return await optimizeGetMapPlan(points,optimizePointsIndex,mapService);
}

/**
 * 优化获取地图计划
 * @param {Array} points 点数组 [{lng: Number, lat: Number, currentTime: String}, ...]
 * @param {Array} optimizePointsIndex 优化点索引数组 [[{index: Number, point: Object}, ...], ...]
 */
async function optimizeGetMapPlan(points,optimizePointsIndex,mapService){
  let planPoints = []
  const promises = optimizePointsIndex.map(async (group) => {
    if (group.length < 2) return;

    const index = group[0].index;

    // 获取新的 GPS 点
    const newPoints = await mapServicePlan(group,mapService);

    //若分组中包含停留点，则根据距离计算出停留点和补点轨迹中那个点最近，直接把对应的补点设置为停留点，其余的删除
    group.map(item=>{
      if(points[item.index].stopTimeSeconds){
        // 计算距离最近的停留点
        let distances =[]
        for(let i=0;i<=newPoints.length;i++){
          let newPoint = newPoints[i]
          if(newPoint){
            distances.push(calculateDistance(
              newPoint,
              points[item.index]
            ))
          }
          
        }
        
        //获取数组中最小的那个值的下标
        const minIndex = distances.reduce((minIdx, currentValue, currentIndex) => 
              currentValue < distances[minIdx] ? currentIndex : minIdx
          , 0);

        //停留点靠到补点上
        newPoints[minIndex].stopTimeSeconds =  points[item.index].stopTimeSeconds
        newPoints[minIndex].endPosition = points[item.index].endPosition
        newPoints[minIndex].startPosition = points[item.index].startPosition
        newPoints[minIndex].startTime = points[item.index].startTime
        newPoints[minIndex].endTime = points[item.index].endTime
        
      }
      
      points[item.index].isDeleted=true
      
    })


    planPoints.push({
      index:index,
      points:newPoints
    })

  });

  // 并发处理所有 mapServicePlan 调用
  await Promise.all(promises);

  let resultPoints = []
  for (let index = 0; index < points.length; index++) {
    const point = points[index];
    //把不需要删除的坐标点添加到结果集中
    if(!point.isDeleted){
      resultPoints.push(point)  
    }
    //每添加一次就判定index处是否在planPoints中存在，存在的话，把对应的gps序列追加到resultPoints中
    planPoints.map(item=>{
      if(item.index==index){
        resultPoints.push(...item.points)
      }
    })
  }

  return resultPoints;
}

/**
 * 记录距离超过平均值50%的点对下标
 * @param {Array} points 点数组 [{x: Number, y: Number}, ...]
 * @returns {Array} 二维数组，记录超过距离阈值的点对下标
 */
function recordIndices(points,averageDistance) {
  let distances = [];

  // 计算所有点之间的距离
  for (let index = 1; index < points.length; index++) {
      const lastPoint = points[index - 1];
      const currentPoint = points[index];
      const distance = calculateDistance(lastPoint, currentPoint);
      distances.push(distance);
  }

  // 阈值
  const threshold = averageDistance * config.smoothnessAvgThreshold;

  let result = [];
  let tempIndices = [];

  for (let i = 0; i < distances.length; i++) {
      if (distances[i] > threshold) {
          if (tempIndices.length === 0) {
              tempIndices.push({
                index:i,
                point:points[i]
              }, {
                index:i+1,
                point:points[i+1]
              });
          } else {
              tempIndices.push({
                index:i+1,
                point:points[i+1]
              });
          }
      } else {
          if (tempIndices.length > 0) {
              result.push([...new Set(tempIndices)]);
              tempIndices = [];
          }
      }
  }

  // 如果循环结束时还有未处理的临时下标
  if (tempIndices.length > 0) {
      result.push([...new Set(tempIndices)]);
  }

  return result;
}


/**
 * 去掉最大值和最小值和零后，统计距离平均值
 * @param {Array} points 点数组 [{x: Number, y: Number}, ...]
 * @returns {Number} 平均距离
 */
function calculateAverageDistance(points) {
  if (points.length < 3) {
    throw new Error('点的数量必须大于等于3');
  }

  let distances = [];

  // 计算所有点之间的距离
  for (let index = 1; index < points.length; index++) {
      const lastPoint = points[index - 1];
      const currentPoint = points[index];
      const distance = calculateDistance(lastPoint, currentPoint);
      if(distance>0){//排除掉等于0的值
        distances.push(distance);
      }
  }

  // 去掉所有的最大值和最小值
  const maxDistance = Math.max(...distances);
  const minDistance = Math.min(...distances);
  distances = distances.filter(distance => distance !== maxDistance && distance !== minDistance);

  // 如果所有的最大值和最小值都被移除后，数组为空，则返回 0
  if (distances.length === 0) {
      return 0;
  }

  // 计算平均值
  const sum = distances.reduce((acc, curr) => parseFloat(acc)  + parseFloat(curr), 0);
  const averageDistance = sum / distances.length;

  return averageDistance;
}

/**
 * 根据给定的gps坐标起始点，调用不同的地图服务进行路径规划补点
 * @param {*} startPoint 
 * @param {*} endPoint 
 * @param {*} mapService 
 */
async function mapServicePlan(pointGroup,mapService){
  const startPoint = pointGroup[0].point;
  const endPoint = pointGroup[pointGroup.length - 1].point;
  switch (mapService) {
    case 'amap':
      return amapServicePlan(startPoint,endPoint)
      break;
    case 'gmap':
      // return gmapServicePlan(startPoint,endPoint)
      return gmapServicePlan(pointGroup)
      break;
  }

}

/**
 * 调用高德地图步行路径规划，获取路线
 * @param {*} startPoint 
 * @param {*} endPoint 
 * @returns 
 */
async function amapServicePlan(startPoint, endPoint) {
  try {
    
    let data = {}
    //适配uniapp的方式进行请求
    if(config.useUniApp){
      data = await amapServicePlanFetch(startPoint, endPoint);
    }else{
      const response = await fetch(`https://restapi.amap.com/v3/direction/walking?key=${config.aMapKey}&origin=${startPoint.lng},${startPoint.lat}&destination=${endPoint.lng},${endPoint.lat}`);
      data = await response.json();
    }

    if (data.status === '1') { // 成功
      const paths = data.route.paths;
      if (paths.length > 0) {
        let resultPoints = [];
        const steps = paths[0].steps;
        steps.forEach(step => {
          resultPoints = resultPoints.concat(convertAmapGPSToObjects(step.polyline,startPoint.currentTime));
        });
        return resultPoints;
      }
    } else {
      throw new Error('Amap service failed');
    }
  } catch (error) {
    console.error('amapServicePlan Error:', error);
    throw error;
  }
}

function amapServicePlanFetch(startPoint, endPoint) {
  return new Promise((resolve, reject) => {
      uni.request({
          url: `https://restapi.amap.com/v3/direction/walking?key=${config.aMapKey}&origin=${startPoint.lng},${startPoint.lat}&destination=${endPoint.lng},${endPoint.lat}`,
          header: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
          },
          method: 'GET',
          sslVerify: true,
          success: ({ data, statusCode, header }) => {
              resolve(data)
          },
          fail: (error) => { }
      })

  })

}

/**
 * 把amap返回的GPS坐标点序列字符串，转换成{ lng, lat }格式
 * @param {*} gpsString 
 * @returns 
 */
function convertAmapGPSToObjects(gpsString,currentTime) {
  // 分割字符串成经纬度对的数组
  const coordsArray = gpsString.split(';');
  
  // 处理每一对经纬度，将其转换成对象格式
  const result = coordsArray.map(coord => {
    const [lng, lat] = coord.split(',').map(Number);
    return { lng:lng, lat:lat ,currentTime:currentTime,type:'add'};
  });

  return result;
}

/**
 * 调用Google地图步行路径规划，获取路线
 * @param {*} startPoint 
 * @param {*} endPoint 
 * @returns {Promise<Array>} 返回路线点数组
 */
async function gmapServicePlan(points) {
  const startPoint = points[0].point;
  const endPoint = points[points.length - 1].point;

  let path = points.map(item => `${item.point.lat},${item.point.lng}`).join('|');  

  let data = {}
  //适配uniapp的方式进行请求
  if(config.useUniApp){
    data = await gmapServicePlanFetch(path);
  }else{
    const response = await fetch(`https://roads.googleapis.com/v1/snapToRoads?key=${config.gMapKey}&interpolate=true&path=${path}`);
    data = await response.json();
  }

  let resultPoints = [];
  if(data&&data.snappedPoints&&data.snappedPoints.length>0){
    data.snappedPoints.map(item=>{
      let location = item.location;
      location.latitude
      location.longitude
      resultPoints.push(
        { lng: location.longitude, lat: location.latitude, currentTime: startPoint.currentTime, type: 'add' }
      );
    })
  }
  return resultPoints
}

function gmapServicePlanFetch(path) {
  return new Promise((resolve, reject) => {
      uni.request({
          url: `https://roads.googleapis.com/v1/snapToRoads?key=${config.gMapKey}&interpolate=true&path=${path}`,
          header: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
          },
          method: 'GET',
          sslVerify: true,
          success: ({ data, statusCode, header }) => {
              resolve(data)
          },
          fail: (error) => { }
      })
  })
}


/**
 * 把停留点从坐标中单独提出来
 * @param {*} points 
 * @returns 
 */
function dismantleStopPoint(points){
  let stopPoints = []
  points.forEach(item=>{
    if(item.stopTimeSeconds){
      stopPoints.push(item)
    }
  })
  return stopPoints
}

/**
 * 把连续且相距不远的停留点识别出来并且做合并操作
 * @param {*} points 
 */
function proximityStopMerge(points){
  let processedPoints = []; // 存储处理后的 GPS 点
  let i = 0; // 初始化索引
  while (i < points.length) {
    processedPoints.push(points[i]);
    if (points[i].stopTimeSeconds) { // 如果当前点是停留点
        let j = i + 1; // 设置内循环索引

        while (j < points.length) { // 检查后续的停留点
          //计算后续的点和停留点的时间间隔
          const timeInterval = calculateMilliseconds(points[i].currentTime,points[j].currentTime)/(1000*60)

          //如果比较时间间隔超过一定时间则后续的比较不做了
          if(timeInterval <= config.proximityStopTimeInterval){
            // 跳跃设置外循环索引
            i = j; // 从超过 proximityStopThreshold 米的停留点继续处理
            break; // 距离超过 proximityStopThreshold 米，结束内循环
          }
          
          if (points[j].stopTimeSeconds) { // 检查是否为停留点
            
            //计算后续的停留点和当前停留点的距离
            const distance = calculateDistance(
                points[i],
                points[j]
            );

            if (distance <= config.proximityStopThreshold ) { 
              // 如果距离小于等于 proximityStopThreshold 米
              // 则忽略掉后续距离较近的停留点
            } else {
              // 跳跃设置外循环索引
              i = j; // 从超过 proximityStopThreshold 米的停留点继续处理
              break; // 距离超过 proximityStopThreshold 米，结束内循环
            }
          }else{
            processedPoints.push(points[j]);
          } 
          
          j++; // 继续检查下一个点
          
        }
        
    }
    
    i++;
  }

  return processedPoints;
}

/**
 * 计算GPS坐标序列的理论中心点(也就是停留点)
 * @param {*} points 
 * @returns 
 */
function calculateGeographicalCenter(points) {
    if (!points || points.length === 0) {
        return null;
    }

    let xSum = 0;
    let ySum = 0;
    let zSum = 0;

    points.forEach(point => {
        const latRad = degreesToRadians(point.lat);
        const lngRad = degreesToRadians(point.lng);

        xSum += Math.cos(latRad) * Math.cos(lngRad);
        ySum += Math.cos(latRad) * Math.sin(lngRad);
        zSum += Math.sin(latRad);
    });

    const numPoints = points.length;
    const xAvg = xSum / numPoints;
    const yAvg = ySum / numPoints;
    const zAvg = zSum / numPoints;

    const lngAvg = Math.atan2(yAvg, xAvg);
    const hyp = Math.sqrt(xAvg * xAvg + yAvg * yAvg);
    const latAvg = Math.atan2(zAvg, hyp);

    //这里一定要注意startPosition和endPosition是停止GPS序列的第一个和最后一个。他们并不会出现在轨迹上。所以不代表停留点在轨迹上的上一个和下一个点
    return {
        lat: radiansToDegrees(latAvg),//纬度
        lng: radiansToDegrees(lngAvg),//经度
        currentTime:points[points.length-1].currentTime,//GPS点上报时间
        startPosition:points[0],//开始停留时的GPS点
        endPosition:points[points.length-1],//结束停留时的GPS点
        startTime:points[0].currentTime,//停留开始时间
        endTime:points[points.length-1].currentTime,//结束停留时间
        stopTimeSeconds:formatMilliseconds(calculateMilliseconds(points[0].currentTime,points[points.length-1].currentTime))//停留时间
    };
}

function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
}

/**
 * 计算两个时间之间的毫秒值
 * @param {*} time1 
 * @param {*} time2 
 * @returns 
 */
function calculateMilliseconds(time1, time2) {
  // 使用全局变量 timeformat 解析时间字符串
  let date1 = moment(time1, config.timeformat);
  let date2 = moment(time2, config.timeformat);

  // 计算两个日期之间的毫秒值差异
  let milliseconds = Math.abs(date2 - date1);
  return milliseconds;
}

/**
 * 格式化时间。渲染成可以迅速看懂的自适应值
 * @param {*} milliseconds 
 * @returns 
 */
function formatMilliseconds(milliseconds) {
    // 定义时间单位的毫秒值
    const oneSecond = 1000;
    const oneMinute = 60 * oneSecond;
    const oneHour = 60 * oneMinute;
    const oneDay = 24 * oneHour;

    // 如果小于一分钟，显示多少秒
    if (milliseconds < oneMinute) {
        let seconds = Math.floor(milliseconds / oneSecond);
        return `${seconds}${getI18nValue(config.locale,'seconds')}`;
    }

    // 如果小于一小时，显示多少分钟多少秒
    if (milliseconds < oneHour) {
        let minutes = Math.floor(milliseconds / oneMinute);
        let seconds = Math.floor((milliseconds % oneMinute) / oneSecond);
         return `${minutes}${getI18nValue(config.locale,'minutes')} ${seconds}${getI18nValue(config.locale,'seconds')}`;
    }

    // 如果小于一天，显示多少小时多少分钟
    if (milliseconds < oneDay) {
        let hours = Math.floor(milliseconds / oneHour);
        let minutes = Math.floor((milliseconds % oneHour) / oneMinute);
        return `${hours}${getI18nValue(config.locale,'hours')} ${minutes}${getI18nValue(config.locale,'minutes')}`;
    }

    // 如果大于一天，显示“X天前”
    let days = Math.floor(milliseconds / oneDay);
    return `${days}${getI18nValue(config.locale,'days_ago', { count: days })}`;
}

// 切换语言的方法
function setLanguage(language) {
  config.locale = language
}

/**
 * 计算一组GPS坐标的质心（中心点）
 * @param {Array} positions - 包含GPS坐标的数组，每个坐标是一个对象，具有lat和lon属性
 * @returns {Object|null} - 包含质心纬度和经度的对象，如果输入数组为空，则返回null
 */
function calculateCentroid(positions) {
  // 如果输入的坐标数组为空或未定义，则返回null
  if (!positions || positions.length === 0) {
      return null;
  }

  // 初始化纬度和经度的累加器
  let sumLat = 0;
  let sumLng = 0;

  // 遍历所有的坐标点，累加它们的纬度和经度
  for (let i = 0; i < positions.length; i++) {
      sumLat += positions[i].lat;
      sumLng += positions[i].lng;
  }

  // 计算平均值（质心）的纬度和经度
  const centroidLat = sumLat / positions.length;
  const centroidLng = sumLng / positions.length;

  // 返回包含质心纬度和经度的对象
  return { lat: centroidLat, lng: centroidLng };
}

/**
 * 计算边界框（Bounding Box），包括最小和最大纬度、经度
 * @param {Array} positions - 包含GPS坐标的数组，每个坐标是一个对象，具有lat和lng属性
 * @returns {Object|null} - 包含minLat, maxLat, minLng, maxLng的对象，如果输入数组为空，则返回null
 */
function calculateBoundingBox(positions) {
  if (!positions || positions.length === 0) {
      return null;
  }

  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;

  for (let i = 0; i < positions.length; i++) {
      const lat = positions[i].lat;
      const lng = positions[i].lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
  }

  return { minLat, maxLat, minLng, maxLng };
}

/**
* 根据边界框计算合适的地图缩放级别
* @param {Object} boundingBox - 包含minLat, maxLat, minLng, maxLng的对象
* @param {Number} mapWidth - 地图容器的宽度（像素）
* @param {Number} mapHeight - 地图容器的高度（像素）
* @returns {Number} - 计算出的地图缩放级别
*/
function calculateZoom(boundingBox, mapWidth, mapHeight) {
  if(!boundingBox){
    //轨迹数据有问题时返回的默认缩放比
    return config.defaultZoom
  }
  const WORLD_DIM = { height: 256, width: 256 };
  const ZOOM_MAX = 21;

  function latRad(lat) {
      const sin = Math.sin(lat * Math.PI / 180);
      const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
      return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
  }

  function zoom(mapPx, worldPx, fraction) {
      return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
  }

  const latFraction = (latRad(boundingBox.maxLat) - latRad(boundingBox.minLat)) / Math.PI;
  const lngDiff = boundingBox.maxLng - boundingBox.minLng;
  const lngFraction = ((lngDiff < 0 ? lngDiff + 360 : lngDiff) / 360);

  const latZoom = zoom(mapHeight, WORLD_DIM.height, latFraction);
  const lngZoom = zoom(mapWidth, WORLD_DIM.width, lngFraction);

  return Math.min(latZoom, lngZoom, ZOOM_MAX);
}
/**
 * 生成段落信息 方便展示
 * @param {*} positions GPS坐标
 * @returns 
 */
function generateSegmentInfo(positions) {
  const result = [];
  let movementStart = null; // 用于记录运动开始的点
  let totalDistance = 0; // 用于累加运动段中的距离
  let totalSpeed = 0; // 用于累加运动段中的速度
  let speedCount = 0; // 用于记录速度值的数量

  positions.forEach((position, index) => {
      // 判断是否是停留点
      if (position.startPosition && position.endPosition) {
          // 如果之前有运动点，先将运动段添加到结果中
          if (movementStart) {
              let duration = calculateMilliseconds(positions[index - 1].currentTime, movementStart.currentTime);
              const avgSpeed = speedCount > 0 ? (totalSpeed / speedCount).toFixed(2) : 0; // 计算平均速度
              
              result.push({
                  type: 'motion',
                  startPosition: movementStart,
                  endPosition: { lat: positions[index - 1].lat, lng: positions[index - 1].lng },
                  duration: formatMilliseconds(duration), // 计算运动持续时间
                  startTime: movementStart.currentTime,
                  endTime: positions[index - 1].currentTime,
                  distance: formatDistance(totalDistance), // 累加距离
                  averageSpeed: `${avgSpeed} km/h` // 平均速度
              });
              
              movementStart = null; // 重置运动开始点
              totalDistance = 0; // 重置总距离
              totalSpeed = 0; // 重置总速度
              speedCount = 0; // 重置速度计数
          }

          // 处理停留点
          result.push({
              type: 'stopped',
              startPosition: position.startPosition,
              endPosition: position.endPosition,
              duration: position.stopTimeSeconds,
              startTime: position.startTime,
              endTime: position.endTime,
              distance: 0 // 停留时距离为 0
          });
      } else {
          // 如果是运动点
          if (!movementStart) {
              movementStart = { lat: position.lat, lng: position.lng, currentTime: position.currentTime };
          } else {
              // 累加每个点之间的距离，并限制为2位小数
              totalDistance += parseFloat(calculateDistance(
                  { lat: positions[index - 1].lat, lng: positions[index - 1].lng },
                  { lat: position.lat, lng: position.lng }
              ));
              
              // 累加速度
              if (position.speed) {
                  totalSpeed += position.speed;
                  speedCount++;
              }
          }
      }
  });

  // 处理最后一段运动，如果最后一个点是运动点
  if (movementStart) {
      const lastPosition = positions[positions.length - 1];
      let duration = calculateMilliseconds(lastPosition.currentTime, movementStart.currentTime);
      const avgSpeed = speedCount > 0 ? (totalSpeed / speedCount).toFixed(2) : 0; // 计算平均速度
      
      result.push({
          type: 'motion',
          startPosition: movementStart,
          endPosition: { lat: lastPosition.lat, lng: lastPosition.lng },
          duration: formatMilliseconds(duration), // 计算运动持续时间
          startTime: movementStart.currentTime,
          endTime: lastPosition.currentTime,
          distance: formatDistance(totalDistance), // 累加最后的总距离
          averageSpeed: `${avgSpeed} km/h` // 平均速度
      });
  }

  if (config.openDebug) {
      console.log(result);
  }

  return result;
}

/**
 * 计算两点之间的速度(公里/小时)
 * @param {*} point1 
 * @param {*} point2 
 * @returns 
 */
async function calculateSpeed(point1, point2) {
  var distance = calculateDistance(point1, point2); // 计算两点间的距离（米）
  var timeDiff = calculateMilliseconds(point1.currentTime, point2.currentTime) / 1000; // 时间差（秒）
  if(distance>0&&timeDiff>0){
    return (distance / timeDiff)*3.6; // 速度（公里/小时）
  }
  return 0;
}

/**
 * 计算轨迹点的速度和里程
 * @param {Array} points 轨迹点数组
 * @returns {Number} 总里程（米）
 */
async function calculateSpeedAndMileage(points) {
  // 记录开始时间
  const startTime = Date.now()
  
  let totalMileage = 0
  for (let i = 0; i < points.length-1; i++) {
    //速度
    if(points[i].type=='add'&&points[i+1].type=='add'){//如果两个点都是添加进去的点，那就不计算速度
      points[i].speed=0;
    }else{
      let speed = await calculateSpeed(points[i], points[i + 1])
      points[i].speed=speed;
    }
    //里程
    let mileage = calculateDistance(points[i], points[i + 1])
    points[i].mileage=mileage;
    totalMileage+=parseFloat(mileage)
  }

  // 计算耗时并输出日志
  const endTime = Date.now()
  const timeSpent = endTime - startTime
  console.log(`计算速度和里程完成,共耗时${timeSpent}毫秒`)
  return totalMileage
}

/**
 * 计算GPS轨迹的平均速度
 * @param {*} points 
 */
async function calculateAvgSpeed(points) {
  let newPoints = [];
  // 剔除停留点
  points.forEach(item => {
    if (!item.stopTimeSeconds) {
      newPoints.push(item);
    }
  });
  if (newPoints.length < 2) {
    return 0; // 如果有效的点少于2个，返回0
  }

  
  // 获取速度集合
  let speeds = [];
  for (let index = 1; index < newPoints.length; index++) {
    speeds.push(newPoints[index].speed);
  }

  // 去掉相同的最大值和最小值
  speeds.sort((a, b) => a - b);
  let min = speeds[0];
  let max = speeds[speeds.length - 1];

  let filteredSpeeds = speeds.filter(speed => speed !== min && speed !== max);

  if (filteredSpeeds.length === 0) {
    return 0; // 如果过滤后没有剩余速度，返回0
  }

  // 计算平均速度
  let sum = filteredSpeeds.reduce((acc, speed) => acc + speed, 0);
  let averageSpeed = sum / filteredSpeeds.length;

  return averageSpeed;
}


/**
 * 计算速度区间
 */
async function getSpeedRanges(speeds,totalMileage) {
  //根据总里程的长短控制最多显示的颜色级别。避免过短的轨迹由于gps精度问题显示的颜色太跳跃
  let maxColorLevel= config.speedColors.length
  if(totalMileage<10*1000){//10KM内只渲染前30%的色域
    maxColorLevel = Math.ceil(config.speedColors.length*0.3)
  }else if(totalMileage<30*1000){//10~30KM渲染前60%的色域
    maxColorLevel = Math.ceil(config.speedColors.length*0.6)
  }

  // 去掉速度为0的重复值
  speeds = speeds.filter((value, index, self) => value !== 0 || self.indexOf(value) === index);

  // 排序速度数组
  speeds.sort((a, b) => a - b);

  // 去掉最大值
  speeds.pop();

  // 重新获取最小速度和最大速度
  var minSpeed = Math.min(...speeds);
  var maxSpeed = Math.max(...speeds);
  var rangeStep = (maxSpeed - minSpeed) / maxColorLevel;

  var speedRanges = [];
  for (var i = 0; i < maxColorLevel; i++) {
      speedRanges.push(minSpeed + rangeStep * (i + 1));
  }
  return speedRanges;
}

/**
 * 根据速度和速度区间确定速度的颜色索引
 * @param {*} speed 
 * @param {*} ranges 
 * @returns 
 */
function determineSpeedRange(speed, ranges) {
  for (var i = 0; i < ranges.length; i++) {
      if (speed <= ranges[i]) {
          return i;
      }
  }
  return ranges.length - 1;
}

/**
 * 轨迹美化。由pathColorOptimize参数控制是否开启。根据传入的 speedColors色彩值和长度决定渲染什么颜色以及多少级的颜色阶梯。这主要取决于速度来渲染
 * @param {*} finalPoints 
 * @returns 
 */
async function processTrajectory(finalPoints) {
  var speeds = [];
  let totalMileage = 0;//总里程 单位米
  for (var i = 0; i < finalPoints.length - 1; i++) {
    totalMileage+=parseFloat(finalPoints[i].mileage)
    speeds.push(finalPoints[i].speed);
  }

  if(config.openDebug){
    console.log("总里程",totalMileage)
  }
  
  var speedRanges = await getSpeedRanges(speeds,totalMileage);

  var result = [];
  var currentSegment = { color: "", path: [], type: "general" };

  for (var i = 0; i < finalPoints.length - 1; i++) {
      var point1 = finalPoints[i];
      var point2 = finalPoints[i + 1];
      var speed = speeds[i];

      var speedIndex = determineSpeedRange(speed, speedRanges);
      var color = config.speedColors[speedIndex];

      // 下个点是add，则开始新的段
      if(currentSegment.type=='add'&&point2.type!='add'){
        if (currentSegment.path.length > 0) {
          currentSegment.path.push(point1);
          result.push(currentSegment);
        }
        // 创建新的段，从上一个段的最后一个点开始
        currentSegment = { color: color, path: [point2],type: "general" };
      }else if (currentSegment.color !== color) {
          if (currentSegment.path.length > 0) {
            currentSegment.path.push(point1);
            result.push(currentSegment);
          }
          // 创建新的段，从上一个段的最后一个点开始
          if(point2.type=='add'){
            currentSegment = { color: "", path: [point1],type: "add" };
          }else{
            currentSegment = { color: color, path: [point1],type: "general" };
          }
          
      }

      // 将当前点添加到当前段中
      currentSegment.path.push(point1);

      // 添加最后一点（为了确保段完整）
      if (i === finalPoints.length - 2) {
          currentSegment.path.push(point2);
          result.push(currentSegment);
      }
  }

  //最后进行颜色平滑过渡处理
  return result
}

/**
 * gps坐标点抽样。用于渲染轨迹
 * @param {*} finalPoints 
 * @returns 
 */
function samplePoints(finalPoints) {
  const totalPoints = finalPoints.length;
  let numSamples = config.samplePointsNum

  if (totalPoints <= numSamples) {
      // 如果总点数少于等于所需的样本数量，直接返回所有点
      return finalPoints;
  }

  // 计算步长
  const step = (totalPoints - 1) / (numSamples - 1);
  const sampledPoints = [];

  // 确保包含第一个点
  sampledPoints.push(finalPoints[0]);

  for (let i = 1; i < numSamples - 1; i++) {
      // 计算当前样本的索引
      const index = Math.round(i * step);
      sampledPoints.push(finalPoints[index]);
  }

  // 确保包含最后一个点
  sampledPoints.push(finalPoints[totalPoints - 1]);

  return sampledPoints;
}

const GpsPathTransfigure = {
  conf:async (newConfig) => {
    config = { ...config, ...newConfig };
  },
  optimize: optimize,
  setLanguage:setLanguage,
};


export default GpsPathTransfigure;