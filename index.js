import {getI18nValue} from  "./lang/i18n"

//配置文件
var config={
    minComparisonPoints : 10, // 最少比较的点数
    distanceThresholdPercentage : 90, // 距离阈值内的点的百分比
    distanceThreshold : 35, // 距离阈值，单位为米
    stationaryEndPoints : 10, // 判断静止状态结束的连续点数
    proximityStopThreshold:35,// 近距离停留点阈值。此值通常要大于等于distanceThreshold
    proximityStopMerge:false,// 近距离停留点合并。建议默认开启
    format : true,//是否格式化数据内容。如里程、时间信息。若开启则根据locale配置输出对应国家语言的信息的内容
    locale : 'zh'//设置语言
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
  const deltaLon = (point2.lon - point1.lon) * Math.PI / 180; // 经度差转换为弧度

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2); // Haversine公式的中间变量
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
function optimize(gpsPoints) {
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
  

  // 返回处理后的轨迹点数组
  return {
    "finalPoints": finalPoints,
    "stopPoints":dismantleStopPoint(finalPoints),
  }; 
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
          if (points[j].stopTimeSeconds) { // 检查是否为停留点
            const distance = calculateDistance(
                points[i],
                points[j]
            );

            if (distance <= config.proximityStopThreshold) { 
              // 如果距离小于等于 proximityStopThreshold 米
              // 则忽略掉后续距离较近的停留点
            } else {
              // 跳跃设置外循环索引
              i = j+1; // 从超过 proximityStopThreshold 米的停留点继续处理
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
        const lonRad = degreesToRadians(point.lon);

        xSum += Math.cos(latRad) * Math.cos(lonRad);
        ySum += Math.cos(latRad) * Math.sin(lonRad);
        zSum += Math.sin(latRad);
    });

    const numPoints = points.length;
    const xAvg = xSum / numPoints;
    const yAvg = ySum / numPoints;
    const zAvg = zSum / numPoints;

    const lonAvg = Math.atan2(yAvg, xAvg);
    const hyp = Math.sqrt(xAvg * xAvg + yAvg * yAvg);
    const latAvg = Math.atan2(zAvg, hyp);

    return {
        lat: radiansToDegrees(latAvg),//纬度
        lon: radiansToDegrees(lonAvg),//经度
        currentTime:points[points.length-1].currentTime,//GPS点上报时间
        startPosition:points[0],//开始停留时的GPS点
        endPosition:points[points.length-1],//结束停留时的GPS点
        startTime:points[0].currentTime,//停留开始时间
        endTime:points[points.length-1].currentTime,//结束停留时间
        stopTimeSeconds:calculateMilliseconds(points[0].currentTime,points[points.length-1].currentTime)//停留时间
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
    // 将时间字符串转换为 Date 对象
    let date1 = new Date(time1.replace(' ', 'T'));
    let date2 = new Date(time2.replace(' ', 'T'));

    // 计算两个日期之间的毫秒值差异
    let milliseconds = Math.abs(date2 - date1);

    return formatMilliseconds(milliseconds);
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

const GpsPathTransfigure = {
  conf: (newConfig) => {
    config = { ...config, ...newConfig };
  },
  optimize: optimize,
  calculateDistance:calculateDistance,
  setLanguage:setLanguage,
};


export default GpsPathTransfigure;