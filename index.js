import {getI18nValue} from  "./lang/i18n"
import  moment from "moment"

//配置文件
var config={
    minComparisonPoints : 10, // 最少比较的点数
    distanceThresholdPercentage : 70, // 距离阈值内的点的百分比
    distanceThreshold : 45, // 距离阈值，单位为米
    stationaryEndPoints : 10, // 判断静止状态结束的连续点数
    
    proximityStopThreshold:50,// 近距离停留点距离阈值。此值通常要大于等于distanceThreshold
    proximityStopTimeInterval:60,//近距离停留点时间间隔阈值。单位分钟
    proximityStopMerge:true,// 近距离停留点合并。建议默认开启
    
    smoothness:true,//是否开启停留点前后点位的平滑过度。你必须配置对应的地图密钥。否则无效。开启此项会额外消耗移动端流量，并且轨迹渲染速度也会降低
    smoothnessAvgThreshold:2,//平滑过度距离倍数阈值。点之间的距离超过平均值的这个倍数后，才会被捕捉到进行平滑处理
    aMapKey:'',// 配置高德地图可以调用jsapi路线规划的密钥
    gMapKey:'',// 配置google地图密钥
    defaultMapService:'',// 默认地图服务。枚举值【amap】【gmap】。不配置则默认语言是zh时使用amap。其它语言都适用googleMap
    
    format : true,//是否格式化数据内容。如里程、时间信息。若开启则根据locale配置输出对应国家语言的信息的内容
    locale : 'zh',//设置语言
    timeformat:'yyyy-MM-dd HH:mm:ss'//指定时间格式化方式
}


/**
 * 计算两个点之间的距离
 * @param {*} point1 
 * @param {*} point2 
 * @returns 
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
        return `${meters}${getI18nValue(config.locale,'meter')}`;
    }

    // 如果大于等于1000米，显示多少公里
    let kilometers = (meters / oneKilometer).toFixed(2); // 保留两位小数
    return `${kilometers}${getI18nValue(config.locale,'kilometer')}`;
}

/**
 * 寻找停留点
 * @param {*} gpsPoints 
 * @returns 
 */
async function optimize(gpsPoints) {
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

      const centerPoint = calculateGeographicalCenter(staticPointsSequence);
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

  // 停留点前后点位的平滑过度
  if(config.smoothness){
    finalPoints = await smoothness(finalPoints)
  }

  // 返回处理后的轨迹点数组
  return {
    "finalPoints": finalPoints,
    "stopPoints" : stopPoints,
  }; 
}

/**
 * 停留点平滑过度
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
 * 平滑处理
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
  // return await optimizeGetMapPlan(points,optimizePointsIndex);
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

    const startPoint = group[0].point;
    const endPoint = group[group.length - 1].point;
    const index = group[0].index;

    // 获取新的 GPS 点
    const newPoints = await mapServicePlan(startPoint, endPoint,mapService);
    planPoints.push({
      index:index,
      points:newPoints
    })

    //标记要删除的GPS
    group.map(item=>{
      points[item.index].isDeleted=true
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
async function mapServicePlan(startPoint,endPoint,mapService){
  switch (mapService) {
    case 'amap':
      return amapServicePlan(startPoint,endPoint)
      break;
    case 'gmap':
      return gmapServicePlan(startPoint,endPoint)
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
    const response = await fetch(`https://restapi.amap.com/v3/direction/walking?key=${config.aMapKey}&origin=${startPoint.lng},${startPoint.lat}&destination=${endPoint.lng},${endPoint.lat}`);
    const data = await response.json();
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
async function gmapServicePlan(startPoint, endPoint) {
  var directionsService = new google.maps.DirectionsService();

  var request = {
    origin: `${startPoint.lat},${startPoint.lng}`,
    destination: `${endPoint.lat},${endPoint.lng}`,
    travelMode: 'WALKING'
  };

  return new Promise((resolve, reject) => {
    directionsService.route(request, (result, status) => {
      if (status === 'OK') {
        const legs = result.routes[0].legs;
        if (legs.length > 0) {
          let resultPoints = [];
          const steps = legs[0].steps;
          steps.forEach(step => {
            let start_location = step.start_location;
            let end_location = step.end_location;
            resultPoints.push(
              { lng: start_location.lng(), lat: start_location.lat(), currentTime: startPoint.currentTime, type: 'add' },
              { lng: end_location.lng(), lat: end_location.lat(), currentTime: startPoint.currentTime, type: 'add' }
            );
          });
          resolve(resultPoints);
        } else {
          reject(new Error('No legs found in the route'));
        }
      } else {
        reject(new Error('Directions request failed due to ' + status));
      }
    });
  });
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

          //如果比较时间间隔超过一定时间则后续的比较不做了。
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
 * 计算GPS坐标序列的理论中心点
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
 * 动态加载GoogleJSAPI
 * @param {*} apiKey 
 * @returns 
 */
function loadGoogleMapsAPI(apiKey) {
  return new Promise((resolve, reject) => {
    if (typeof google !== 'undefined' && google.maps) {
      // 如果已经加载过 Google Maps API
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      resolve();
    };

    script.onerror = (error) => {
      reject(new Error('Failed to load Google Maps API'));
    };

    document.head.appendChild(script);
  });
}

/**
 * 动态加载高德地图 JavaScript API
 * @param {string} apiKey - 高德地图 API 的 key
 * @returns {Promise<void>} - 返回一个 Promise，在 API 加载完成时解析
 */
function loadAMapsAPI(apiKey) {
  return new Promise((resolve, reject) => {
    // 如果已经加载过 AMap 对象，则直接 resolve
    if (typeof AMap !== 'undefined' && AMap.Map) {
      resolve();
      return;
    }

    // 创建一个新的 script 元素
    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${apiKey}&plugin=AMap.Walking`;
    script.async = true;
    script.defer = true;

    // 设置加载完成和失败的处理函数
    script.onload = () => {
      // 高德地图 API 加载成功
      resolve();
    };

    script.onerror = (error) => {
      // 加载失败
      reject(new Error('Failed to load AMaps API'));
    };

    // 将 script 元素添加到页面头部，开始加载
    document.head.appendChild(script);
  });
}


const GpsPathTransfigure = {
  conf:async (newConfig) => {
    config = { ...config, ...newConfig };
    //按需动态加载地图组件
    if(config.gMapKey!=''){
      await loadGoogleMapsAPI(config.gMapKey);
    }
    // 暂时不加载js api。因为高德js api一定要渲染地图到界面上。改用web服务
    // if(config.aMapKey!=''){
    //   await loadAMapsAPI(config.aMapKey);
    // }
  },
  optimize: optimize,
  calculateDistance:calculateDistance,
  setLanguage:setLanguage,
};


export default GpsPathTransfigure;