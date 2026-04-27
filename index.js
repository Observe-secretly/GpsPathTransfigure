import {getI18nValue} from  "./lang/i18n"
import  moment from "moment"


//配置文件
var config={
    minComparisonPoints : 10, // 【删除】最少比较的点数（旧版静止识别使用，现已切换为规则区间驱动）
    distanceThresholdPercentage : 70, // 【删除】距离阈值内的点的百分比（旧版静止识别使用）
    distanceThreshold : 35, // 距离阈值，单位为米
    stationaryEndPoints : 10, // 【删除】判断静止状态结束的连续点数（旧版静止识别使用）
    limitStopPointTime : 10,// 【删除】停留点时间阈值（旧版停留点二次加工使用）
    
    autoOptimize : false, // 【删除】是否开启参数自动优化
    autoOptimizeMaxCount : 10,// 【删除】自动优化调整次数
    
    abnormalPointRatio:0.05,//异常点占比阈值。若异常点占比超过此值，则会被认为是异常点识别功能失效或不适合此轨迹
    IQRThreshold:2.5,// 异常值检测阈值。此值通常要大于等于1.5

    speedIQRThreshold:0.75,// 速度异常值检测阈值

    limitSpeed:150,// 最大速度。单位：千米/小时。两点之间的速度超过此值的gps点不参与计算平均速度

    proximityStopThreshold:45,// 近距离停留点距离阈值。此值通常要大于等于distanceThreshold
    proximityStopTimeInterval:60,//近距离停留点时间间隔阈值。单位分钟
    proximityStopMerge:true,// 近距离停留点合并。建议默认开启【删除】
    
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

    // ------------------------ 漂移观测（observeStopPointDirectionDrift）参数区 ------------------------
    // 这块是“角度漂移观测”的统一配置。你以后调参，优先改这里，不用进函数里找常量。
    driftObserveWindowSize:31,//窗口大小（滑动窗口）。越大越稳，越小越灵敏
    driftObserveStartStreak:5,//进入区间前，需要连续命中高阈值的点数（原来过大容易一个区间都进不去）
    driftObserveEndStreak:5,//退出区间前，需要连续命中低阈值的点数
    driftObserveHighQuantile:0.65,//分位模式下的高阈值分位点
    driftObserveLowQuantile:0.35,//分位模式下的低阈值分位点（建议小于高阈值分位）

    driftObserveBandRatioMin:0.35,//分布退化判据1：bandRatio 最小值
    driftObserveSpreadMin:0.35,//分布退化判据2：spread 最小值
    driftObserveAbsHighScore:1.2,//高分占比统计的绝对分数线
    driftObserveAbsMedianScoreMin:0.7,//高分门控：中位数最低要求
    driftObserveHighScoreRatioTrigger:0.4,//高分门控：高分占比最低要求
    driftObserveMinFallbackSampleSize:30,//最小样本保护：低于此值不切 fallback

    driftObserveAbsAngleHigh:60,//fallback（固定角度模式）进入阈值（漂移抖动场景适当降低，避免“rawCount=0”）
    driftObserveAbsAngleLow:35,//fallback（固定角度模式）退出阈值（保持滞回，避免频繁抖动开关）

    driftObserveMergeDistanceThresholdMeters:55,//区间合并：中心点距离阈值（米）
    driftObserveMergeGapMaxMinutes:45,//区间合并：区间间隔阈值（分钟）
    driftObserveMinStopDurationMinutes:30,//区间保留：最短时长阈值（分钟）
    driftObserveDensityEpsMeters:50,//DBSCAN密度半径（米）
    driftObserveDensityMinPts:5,//DBSCAN最小核心点邻居数
    driftObserveDensitySampleTriggerCount:100,//DBSCAN性能保护：点数超过该值时触发采样
    driftObserveDensityMaxPoints:200,//DBSCAN性能保护：参与聚类的点数上限（超过就采样到最多100个点）
    driftObserveDensityScoreThreshold:0.6,//二次判定阈值：densityScore低于此值就释放为普通点
    driftObserveDensityScoreEnabled:true,//是否开启DBSCAN密度二次判定（关闭后所有时长过滤后的合并区间都直接保留为停留点）

    // ------------------------ 低速候选（第一层，与方向漂移并列） ------------------------
    driftObserveLowSpeedCandidateEnabled:true,//是否把「窗口内低速占比」作为候选区间来源（默认开；关闭则与旧版行为一致，仅方向漂移）
    driftObserveLowSpeedThresholdKmh:5,//原始速度低于等于该值（km/h，来自 p 解析）视为低速采样点
    driftObserveLowSpeedRatioThreshold:0.7,//窗口内低速点占比达到该值则该转角索引命中低速候选
}

/**
 * 解析上报点中的 `p`：14 位十六进制串，7 字节 BE。
 * speed、direction 为 ×10 放大存储，解码后除以 10；其余为单字节整数。
 * @param {unknown} p
 * @returns {{
 *   rawSpeed:number|null,
 *   rawDirection:number|null,
 *   hdop:number|null,
 *   vdop:number|null,
 *   satelliteCount:number|null,
 *   pParseOk:boolean
 * }}
 */
function parseGpsExtraPayload(p) {
  const empty = {
    rawSpeed: null,
    rawDirection: null,
    hdop: null,
    vdop: null,
    satelliteCount: null,
    pParseOk: false
  };
  if (p === undefined || p === null) return empty;
  let hex = String(p).trim().replace(/^0x/i, "");
  if (!hex.length) return empty;
  // 兼容奇长：左侧补零凑齐偶数位
  if (hex.length % 2 !== 0) hex = `0${hex}`;
  const expectedChars = 14;
  if (hex.length !== expectedChars) return empty;

  try {
    const speedInt = parseInt(hex.slice(0, 4), 16);
    const dirInt = parseInt(hex.slice(4, 8), 16);
    const hdopByte = parseInt(hex.slice(8, 10), 16);
    const vdopByte = parseInt(hex.slice(10, 12), 16);
    const satByte = parseInt(hex.slice(12, 14), 16);

    const rawSpeed = Number.isFinite(speedInt) ? speedInt / 10 : null;
    const rawDirection = Number.isFinite(dirInt) ? dirInt / 10 : null;
    const hdop = Number.isFinite(hdopByte) ? hdopByte : null;
    const vdop = Number.isFinite(vdopByte) ? vdopByte : null;
    const satelliteCount = Number.isFinite(satByte) ? satByte : null;

    return {
      rawSpeed,
      rawDirection,
      hdop,
      vdop,
      satelliteCount,
      pParseOk: Number.isFinite(rawSpeed) || Number.isFinite(rawDirection)
    };
  } catch (_) {
    return empty;
  }
}

/**
 * 把 `p` 解码字段合并进轨迹点对象，便于后续漂移与调试使用。
 * @param {Array<Record<string,unknown>>} points
 * @returns {Array<Record<string,unknown>>}
 */
function normalizeGpsPointsWithPayload(points) {
  if (!Array.isArray(points)) return points;
  return points.map(point => {
    if (!point || typeof point !== "object") return point;
    const decoded = parseGpsExtraPayload(point.p);
    return {
      ...point,
      rawSpeed: decoded.rawSpeed,
      rawDirection: decoded.rawDirection,
      hdop: decoded.hdop,
      vdop: decoded.vdop,
      satelliteCount: decoded.satelliteCount,
      pParseOk: decoded.pParseOk
    };
  });
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


  return Number((R * c).toFixed(2)); // 计算最终距离，单位为米，并保留两位小数
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
 * 统一返回一个“空的漂移观测结果”。
 * 这个小方法的目的很简单：避免在主流程里到处手写同样的空对象，后续字段扩展也只改这一处。
 * @returns {{vectorAngleFromXAxisSeries:Array,turnAngleSeries:Array,driftIntervals:Array,mergedDriftIntervals:Array,thresholdMeta:Object}}
 */
function createEmptyDriftObservationResult() {
  // 这里刻意把结构写完整，调用方拿到后不需要再判空字段。
  return {
    vectorAngleFromXAxisSeries: [],
    turnAngleSeries: [],
    driftIntervals: [],
    mergedDriftIntervals: [],
    thresholdMeta: {}
  };
}

/**
 * 把全局 config 里的漂移观测参数整理成“运行期配置”。
 * 你可以把这个方法理解成一个“参数适配层”：主流程只读这里，不直接散读 config。
 * @returns {{
 *  windowSize:number,startStreak:number,endStreak:number,highQuantile:number,lowQuantile:number,
 *  bandRatioMin:number,spreadMin:number,absHighScore:number,absMedianScoreMin:number,highScoreRatioTrigger:number,
 *  minFallbackSampleSize:number,absAngleHigh:number,absAngleLow:number,normalColor:string,
 *  mergeDistanceThresholdMeters:number,mergeGapMaxMinutes:number,minStopDurationMinutes:number,
 *  densityEpsMeters:number,densityMinPts:number,densitySampleTriggerCount:number,densityMaxPoints:number,densityScoreThreshold:number,
 *  densityScoreEnabled:boolean
 * }}
 */
function resolveDriftObservationConfig() {
  // 在这里做一次参数集中映射，方便后续做默认值兜底、范围裁剪等扩展。
  return {
    windowSize: config.driftObserveWindowSize,
    startStreak: config.driftObserveStartStreak,
    endStreak: config.driftObserveEndStreak,
    highQuantile: config.driftObserveHighQuantile,
    lowQuantile: config.driftObserveLowQuantile,
    bandRatioMin: config.driftObserveBandRatioMin,
    spreadMin: config.driftObserveSpreadMin,
    absHighScore: config.driftObserveAbsHighScore,
    absMedianScoreMin: config.driftObserveAbsMedianScoreMin,
    highScoreRatioTrigger: config.driftObserveHighScoreRatioTrigger,
    minFallbackSampleSize: config.driftObserveMinFallbackSampleSize,
    absAngleHigh: config.driftObserveAbsAngleHigh,
    absAngleLow: config.driftObserveAbsAngleLow,
    normalColor: "#8a8f98",
    mergeDistanceThresholdMeters: config.driftObserveMergeDistanceThresholdMeters,
    mergeGapMaxMinutes: config.driftObserveMergeGapMaxMinutes,
    minStopDurationMinutes: config.driftObserveMinStopDurationMinutes,
    densityEpsMeters: config.driftObserveDensityEpsMeters,
    densityMinPts: config.driftObserveDensityMinPts,
    densitySampleTriggerCount: config.driftObserveDensitySampleTriggerCount,
    densityMaxPoints: config.driftObserveDensityMaxPoints,
    densityScoreThreshold: config.driftObserveDensityScoreThreshold,
    densityScoreEnabled: config.driftObserveDensityScoreEnabled !== false,
    lowSpeedCandidateEnabled: config.driftObserveLowSpeedCandidateEnabled !== false,
    lowSpeedThresholdKmh: config.driftObserveLowSpeedThresholdKmh,
    lowSpeedRatioThreshold: config.driftObserveLowSpeedRatioThreshold
  };
}

/**
 * 根据 driftScore 序列 + 转角序列，计算“当前应该走哪种阈值策略”。
 * 这个方法是混合阈值的核心：分位模式（quantile）还是固定角度 fallback，由这里统一决策。
 * @param {number[]} driftScoreSeries
 * @param {Array} turnAngleSeries
 * @param {ReturnType<typeof resolveDriftObservationConfig>} driftConfig
 * @param {(values:number[], quantile:number)=>number} percentile
 * @returns {{
 *  quantileHighThreshold:number,quantileLowThreshold:number,p10:number,p50:number,p90:number,
 *  spread:number,band:number,bandRatio:number,highScoreRatio:number,sufficientSamples:boolean,
 *  distributionDegraded:boolean,highnessGate:boolean,useFallback:boolean,thresholdMode:string,
 *  highThreshold:number,lowThreshold:number,fallbackReason:string[],fallbackSignalSeries:number[]
 * }}
 */
function buildDriftThresholdMeta(driftScoreSeries, turnAngleSeries, driftConfig, percentile) {
  // 先算分位阈值（这是默认模式）
  const quantileHighThreshold = percentile(driftScoreSeries, driftConfig.highQuantile);
  const quantileLowThreshold = percentile(driftScoreSeries, driftConfig.lowQuantile);

  // 再算退化识别统计量（判断分位阈值是不是“失真”）
  const p10 = percentile(driftScoreSeries, 0.1);
  const p50 = percentile(driftScoreSeries, 0.5);
  const p90 = percentile(driftScoreSeries, 0.9);
  const spread = p90 - p10;
  const band = quantileHighThreshold - quantileLowThreshold;
  const bandRatio = band / Math.max(spread, 1e-6);

  // 高分占比：用外生绝对分数线，避免“分位阈值循环依赖”
  const highScoreCount = driftScoreSeries.reduce((count, score) => (
    score >= driftConfig.absHighScore ? count + 1 : count
  ), 0);
  const highScoreRatio = driftScoreSeries.length ? highScoreCount / driftScoreSeries.length : 0;

  // 自动切换开关：样本够 + 分布退化 + 高分门控
  const sufficientSamples = driftScoreSeries.length >= driftConfig.minFallbackSampleSize;
  const distributionDegraded = spread < driftConfig.spreadMin || bandRatio < driftConfig.bandRatioMin;
  const highnessGate = p50 >= driftConfig.absMedianScoreMin || highScoreRatio >= driftConfig.highScoreRatioTrigger;
  const useFallback = sufficientSamples && distributionDegraded && highnessGate;

  // fallback 模式下，信号从 driftScore 换成 |turnAngle|，阈值改为固定角度滞回
  const fallbackSignalSeries = turnAngleSeries.map(item => {
    const angleAbs = Math.abs(Number(item.turnAngle));
    return Number.isFinite(angleAbs) ? angleAbs : 0;
  });
  const thresholdMode = useFallback ? "fixed_angle_fallback" : "quantile_score";
  const highThreshold = useFallback ? driftConfig.absAngleHigh : quantileHighThreshold;
  const lowThreshold = useFallback ? driftConfig.absAngleLow : quantileLowThreshold;

  const fallbackReason = [];
  if (useFallback) {
    if (spread < driftConfig.spreadMin) fallbackReason.push("spread_too_small");
    if (bandRatio < driftConfig.bandRatioMin) fallbackReason.push("band_ratio_too_small");
    if (p50 >= driftConfig.absMedianScoreMin) fallbackReason.push("median_score_high");
    if (highScoreRatio >= driftConfig.highScoreRatioTrigger) fallbackReason.push("high_score_ratio_high");
  }

  return {
    quantileHighThreshold,
    quantileLowThreshold,
    p10,
    p50,
    p90,
    spread,
    band,
    bandRatio,
    highScoreRatio,
    sufficientSamples,
    distributionDegraded,
    highnessGate,
    useFallback,
    thresholdMode,
    highThreshold,
    lowThreshold,
    fallbackReason,
    fallbackSignalSeries
  };
}

/**
 * 用“统一信号 + 上下阈值 + 连续命中点数”去切漂移区间。
 * 你可以把它看成一个小状态机：没进区间时看 high，进了区间后看 low。
 * @param {number[]} signalSeries
 * @param {number} highThreshold
 * @param {number} lowThreshold
 * @param {number} startStreak
 * @param {number} endStreak
 * @param {(usedColors:string[])=>string} pickDistinctRandomColor
 * @returns {Array<{id:number,startIndex:number,endIndex:number,color:string}>}
 */
function detectDriftIntervalsBySignal(
  signalSeries,
  highThreshold,
  lowThreshold,
  startStreak,
  endStreak,
  pickDistinctRandomColor
) {
  const driftIntervals = [];
  const usedDriftColors = [];
  let inInterval = false;
  let startCounter = 0;
  let endCounter = 0;
  let intervalStartIndex = -1;

  // 这里逐点扫描，进入和退出分别走不同计数器，避免阈值边缘抖动。
  for (let i = 0; i < signalSeries.length; i++) {
    const score = signalSeries[i];
    if (!inInterval) {
      if (score >= highThreshold) {
        startCounter++;
      } else {
        startCounter = 0;
      }
      if (startCounter >= startStreak) {
        inInterval = true;
        // 这里“进入区间”的连续命中点，只用来确认，不算进停留区间本体。
        // 所以起点直接落在“连续命中窗口”之后的下一点。
        intervalStartIndex = i + 1;
        startCounter = 0;
        endCounter = 0;
      }
    } else {
      if (score <= lowThreshold) {
        endCounter++;
      } else {
        endCounter = 0;
      }
      if (endCounter >= endStreak) {
        // 同理，“退出区间”的连续命中点只用来确认，不算进停留区间本体。
        // 所以终点落在“连续命中窗口”之前的上一点。
        const intervalEndIndex = i - endStreak;
        const displayColor = pickDistinctRandomColor(usedDriftColors);
        usedDriftColors.push(displayColor);
        if (intervalStartIndex >= 0 && intervalStartIndex <= intervalEndIndex) {
          driftIntervals.push({
            id: driftIntervals.length + 1,
            startIndex: intervalStartIndex,
            endIndex: intervalEndIndex,
            color: displayColor
          });
        }
        inInterval = false;
        intervalStartIndex = -1;
        endCounter = 0;
      }
    }
  }

  // 如果扫完整段还在区间内，补一个“收尾区间”。
  if (inInterval && intervalStartIndex >= 0) {
    const displayColor = pickDistinctRandomColor(usedDriftColors);
    usedDriftColors.push(displayColor);
    // 这里没有触发“退出确认窗口”，所以不做 endStreak 的回退。
    if (intervalStartIndex <= signalSeries.length - 1) {
      driftIntervals.push({
        id: driftIntervals.length + 1,
        startIndex: intervalStartIndex,
        endIndex: signalSeries.length - 1,
        color: displayColor
      });
    }
  }

  return driftIntervals;
}

/**
 * 由 sources 数组推导区间来源展示字符串。
 * @param {string[]|undefined} sources
 * @returns {'direction'|'low_speed'|'direction+low_speed'}
 */
function deriveIntervalSourceLabel(sources) {
  const set = new Set(sources || []);
  const hasD = set.has("direction");
  const hasL = set.has("low_speed");
  if (hasD && hasL) return "direction+low_speed";
  if (hasD) return "direction";
  return "low_speed";
}

/**
 * 合并「方向漂移」与「低速候选」在转角索引轴上的区间（重叠或相邻则合并），并重新着色。
 * @param {Array<{startIndex:number,endIndex:number,id:number,color:string}>} directionIntervals
 * @param {Array<{startIndex:number,endIndex:number,id:number,color:string}>} lowSpeedIntervals
 * @param {(usedColors:string[])=>string} pickDistinctRandomColor
 * @returns {Array<{id:number,startIndex:number,endIndex:number,color:string,source:string,sources:string[]}>}
 */
function mergeDirectionAndLowSpeedCandidateIntervals(
  directionIntervals,
  lowSpeedIntervals,
  pickDistinctRandomColor
) {
  const usedColors = [];
  const labeled = [
    ...(directionIntervals || []).map(iv => ({
      startIndex: iv.startIndex,
      endIndex: iv.endIndex,
      tag: "direction"
    })),
    ...(lowSpeedIntervals || []).map(iv => ({
      startIndex: iv.startIndex,
      endIndex: iv.endIndex,
      tag: "low_speed"
    }))
  ];
  if (!labeled.length) return [];

  labeled.sort((a, b) => a.startIndex - b.startIndex);
  const merged = [];
  let cur = { ...labeled[0], tags: new Set([labeled[0].tag]) };
  for (let i = 1; i < labeled.length; i++) {
    const next = labeled[i];
    if (next.startIndex <= cur.endIndex + 1) {
      cur.endIndex = Math.max(cur.endIndex, next.endIndex);
      cur.tags.add(next.tag);
    } else {
      merged.push(cur);
      cur = { ...next, tags: new Set([next.tag]) };
    }
  }
  merged.push(cur);

  return merged.map((range, idx) => {
    const sources = Array.from(range.tags);
    const source = deriveIntervalSourceLabel(sources);
    const color = pickDistinctRandomColor(usedColors);
    usedColors.push(color);
    return {
      id: idx + 1,
      startIndex: range.startIndex,
      endIndex: range.endIndex,
      color,
      source,
      sources
    };
  });
}

/**
 * 观测轨迹里的“方向漂移”信号，主要用于调试和参数验证，不直接改动主业务输出。
 * 你可以把这个方法看成一个“诊断面板生成器”：输入原始 gps 点，输出转角序列、候选区间和阈值元信息。
 * 注意：这个方法的入参/出参是稳定接口，内部即使重构也不应该改外部调用方式。
 * @param {Array<{lat:number,lng:number,currentTime:string}>} gpsPoints GPS 轨迹点数组
 * @returns {{vectorAngleFromXAxisSeries:Array,turnAngleSeries:Array,driftIntervals:Array,mergedDriftIntervals:Array,thresholdMeta?:Object}}
 */
function observeStopPointDirectionDrift(gpsPoints) {
  // 第0步：先做最基础的输入保护，避免后面向量计算越界。
  if (!Array.isArray(gpsPoints) || gpsPoints.length < 3) {
    console.log("角度漂移观测：点位不足3个，无法计算连续向量角度。");
    return createEmptyDriftObservationResult();
  }

  // 第1步：把全局配置收口到一个局部对象，后面统一从 driftConfig 读取参数。
  const driftConfig = resolveDriftObservationConfig();

  const roundAngle = (angle) => Number(angle.toFixed(6));
  const normalizeAngle = (angle) => {
    const normalized = ((angle + 180) % 360 + 360) % 360 - 180;
    return roundAngle(normalized);
  };

  const buildVector = (startPoint, endPoint) => ({
    x: endPoint.lng - startPoint.lng,
    y: endPoint.lat - startPoint.lat
  });

  const isZeroVector = (vector) => vector.x === 0 && vector.y === 0;

  const calculateVectorAngleFromXAxis = (vector) => {
    if (isZeroVector(vector)) {
      return null;
    }
    return roundAngle((Math.atan2(vector.y, vector.x) * 180) / Math.PI);
  };

  const calculateTurnAngle = (firstVector, secondVector) => {
    if (isZeroVector(firstVector) || isZeroVector(secondVector)) {
      return null;
    }
    const firstAngle = (Math.atan2(firstVector.y, firstVector.x) * 180) / Math.PI;
    const secondAngle = (Math.atan2(secondVector.y, secondVector.x) * 180) / Math.PI;
    return normalizeAngle(secondAngle - firstAngle);
  };

  const vectorAngleFromXAxisSeries = [];
  for (let i = 0; i < gpsPoints.length - 1; i++) {
    const currentVector = buildVector(gpsPoints[i], gpsPoints[i + 1]);
    vectorAngleFromXAxisSeries.push({
      fromIndex: i,
      toIndex: i + 1,
      fromTime: gpsPoints[i].currentTime,
      toTime: gpsPoints[i + 1].currentTime,
      vectorAngleFromXAxis: calculateVectorAngleFromXAxis(currentVector)
    });
  }

  const turnAngleSeries = [];
  for (let i = 0; i < gpsPoints.length - 2; i++) {
    const firstVector = buildVector(gpsPoints[i], gpsPoints[i + 1]);
    const secondVector = buildVector(gpsPoints[i + 1], gpsPoints[i + 2]);
    turnAngleSeries.push({
      index: i,
      firstVector: `${i}->${i + 1}`,
      secondVector: `${i + 1}->${i + 2}`,
      fromTime: gpsPoints[i].currentTime,
      middleTime: gpsPoints[i + 1].currentTime,
      toTime: gpsPoints[i + 2].currentTime,
      currentTime: gpsPoints[i + 1].currentTime,
      firstVectorAngleFromXAxis: vectorAngleFromXAxisSeries[i].vectorAngleFromXAxis,
      secondVectorAngleFromXAxis: vectorAngleFromXAxisSeries[i + 1].vectorAngleFromXAxis,
      turnAngle: calculateTurnAngle(firstVector, secondVector)
    });
  }

  const turnAngles = turnAngleSeries.map(item => item.turnAngle);

  const extractValidNumbers = (values) => values.filter(value => Number.isFinite(value));
  const percentile = (values, quantile) => {
    const validValues = extractValidNumbers(values).sort((a, b) => a - b);
    if (!validValues.length) return 0;
    const rank = Math.min(validValues.length - 1, Math.max(0, (validValues.length - 1) * quantile));
    const low = Math.floor(rank);
    const high = Math.ceil(rank);
    if (low === high) return validValues[low];
    const ratio = rank - low;
    return validValues[low] * (1 - ratio) + validValues[high] * ratio;
  };
  const median = (values) => percentile(values, 0.5);
  const calculateMad = (values) => {
    const validValues = extractValidNumbers(values);
    if (!validValues.length) return 0;
    const med = median(validValues);
    const deviations = validValues.map(value => Math.abs(value - med));
    return median(deviations);
  };
  const zScoreSeries = (values) => {
    const validValues = extractValidNumbers(values);
    if (!validValues.length) {
      return values.map(() => 0);
    }
    const mean = validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
    const variance = validValues.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / validValues.length;
    const std = Math.sqrt(variance);
    if (!std) {
      return values.map(() => 0);
    }
    return values.map(value => Number.isFinite(value) ? (value - mean) / std : 0);
  };
  const getWindowRange = (index, length, windowSize) => {
    const half = Math.floor(windowSize / 2);
    return {
      start: Math.max(0, index - half),
      end: Math.min(length - 1, index + half)
    };
  };
  const calculateFlipRate = (windowValues) => {
    const validValues = extractValidNumbers(windowValues).filter(value => value !== 0);
    if (validValues.length < 2) return 0;
    let flips = 0;
    for (let i = 1; i < validValues.length; i++) {
      if (Math.sign(validValues[i]) !== Math.sign(validValues[i - 1])) {
        flips++;
      }
    }
    return flips / (validValues.length - 1);
  };
  const calculateCoherence = (windowValues) => {
    const validValues = extractValidNumbers(windowValues);
    if (!validValues.length) return 0;
    const signedSum = Math.abs(validValues.reduce((sum, value) => sum + value, 0));
    const absSum = validValues.reduce((sum, value) => sum + Math.abs(value), 0);
    if (!absSum) return 0;
    return signedSum / absSum;
  };
  const pickDistinctRandomColor = (usedColors) => {
    const hueFromColor = (color) => Number(color.match(/hsl\((\d+)/)?.[1] || 0);
    for (let attempt = 0; attempt < 20; attempt++) {
      const hue = Math.floor(Math.random() * 360);
      const conflict = usedColors.some(color => {
        const usedHue = hueFromColor(color);
        const distance = Math.min(Math.abs(hue - usedHue), 360 - Math.abs(hue - usedHue));
        return distance < 35;
      });
      if (!conflict) {
        return `hsl(${hue}, 78%, 46%)`;
      }
    }
    const fallbackHue = (usedColors.length * 67) % 360;
    return `hsl(${fallbackHue}, 78%, 46%)`;
  };
  const normalizeIntervalRanges = (intervals, maxIndex) => {
    return (intervals || [])
      .map(interval => ({
        startIndex: Math.max(0, Math.min(maxIndex, interval.startIndex)),
        endIndex: Math.max(0, Math.min(maxIndex, interval.endIndex)),
        color: interval.color,
        id: interval.id,
        source: interval.source,
        sources: interval.sources
      }))
      .filter(interval => interval.endIndex >= interval.startIndex)
      .sort((a, b) => a.startIndex - b.startIndex);
  };
  const buildIntervalSnapshot = (range) => {
    if (!range) return null;
    const start = Math.max(0, Math.min(turnAngleSeries.length - 1, range.startIndex));
    const end = Math.max(0, Math.min(turnAngleSeries.length - 1, range.endIndex));
    if (end < start) return null;
    const startItem = turnAngleSeries[start];
    const endItem = turnAngleSeries[end];
    const startTime = startItem?.fromTime || startItem?.currentTime;
    const endTime = endItem?.toTime || endItem?.currentTime;
    const gpsStart = Math.max(0, start);
    const gpsEnd = Math.min(gpsPoints.length - 1, end + 2);
    let latSum = 0;
    let lngSum = 0;
    let count = 0;
    for (let i = gpsStart; i <= gpsEnd; i++) {
      latSum += gpsPoints[i].lat;
      lngSum += gpsPoints[i].lng;
      count++;
    }
    const durationMs = startTime && endTime ? calculateMilliseconds(startTime, endTime) : 0;
    return {
      startIndex: start,
      endIndex: end,
      startTime,
      endTime,
      durationMs,
      centerLat: count ? latSum / count : 0,
      centerLng: count ? lngSum / count : 0
    };
  };
  const canMergeIntervals = (leftRange, rightRange) => {
    const leftSnapshot = buildIntervalSnapshot(leftRange);
    const rightSnapshot = buildIntervalSnapshot(rightRange);
    if (!leftSnapshot || !rightSnapshot) return false;
    const distance = calculateDistance(
      { lat: leftSnapshot.centerLat, lng: leftSnapshot.centerLng },
      { lat: rightSnapshot.centerLat, lng: rightSnapshot.centerLng }
    );
    const gapMinutes = leftSnapshot.endTime && rightSnapshot.startTime
      ? calculateMilliseconds(leftSnapshot.endTime, rightSnapshot.startTime) / (1000 * 60)
      : Number.POSITIVE_INFINITY;
    return distance <= driftConfig.mergeDistanceThresholdMeters && gapMinutes <= driftConfig.mergeGapMaxMinutes;
  };
  const unionSourceTags = (a, b) => {
    const out = new Set([...(a || []), ...(b || [])]);
    return Array.from(out);
  };

  const mergeIntervalRanges = (ranges) => {
    if (!ranges.length) return [];
    let currentRanges = ranges.map(r => ({
      ...r,
      sources: r.sources || (r.source ? [r.source] : [])
    }));
    let changed = true;
    while (changed) {
      changed = false;
      const nextRanges = [];
      let current = currentRanges[0];
      for (let i = 1; i < currentRanges.length; i++) {
        const candidate = currentRanges[i];
        if (canMergeIntervals(current, candidate)) {
          current = {
            startIndex: Math.min(current.startIndex, candidate.startIndex),
            endIndex: Math.max(current.endIndex, candidate.endIndex),
            color: current.color,
            id: current.id,
            sources: unionSourceTags(current.sources, candidate.sources)
          };
          changed = true;
        } else {
          nextRanges.push(current);
          current = candidate;
        }
      }
      nextRanges.push(current);
      currentRanges = nextRanges;
    }
    return currentRanges;
  };
  const filterIntervalsByDuration = (ranges) => {
    const minDurationMs = driftConfig.minStopDurationMinutes * 60 * 1000;
    return ranges.filter(range => {
      const snapshot = buildIntervalSnapshot(range);
      return snapshot && snapshot.durationMs >= minDurationMs;
    });
  };
  const toColoredIntervals = (ranges) => {
    const usedColors = [];
    return ranges.map((range, index) => {
      const snapshot = buildIntervalSnapshot(range);
      const color = range.color || pickDistinctRandomColor(usedColors);
      if (!range.color) usedColors.push(color);
      const sources = range.sources || (range.source ? [range.source] : []);
      const source = deriveIntervalSourceLabel(sources);
      return {
        id: index + 1,
        startIndex: range.startIndex,
        endIndex: range.endIndex,
        color,
        source,
        sources,
        startTime: snapshot?.startTime || null,
        endTime: snapshot?.endTime || null,
        durationMs: snapshot?.durationMs || 0,
        center: {
          lat: snapshot?.centerLat || 0,
          lng: snapshot?.centerLng || 0
        }
      };
    });
  };

  const computeIntervalRawSpeedStats = (range) => {
    const start = Math.max(0, range.startIndex);
    const end = Math.max(start, range.endIndex);
    const speeds = [];
    for (let ti = start; ti <= end; ti++) {
      const gi = ti + 1;
      if (gi >= 0 && gi < gpsPoints.length) {
        const v = gpsPoints[gi].rawSpeed;
        if (Number.isFinite(v)) speeds.push(v);
      }
    }
    if (!speeds.length) {
      return { avgRawSpeed: null, medianRawSpeed: null, intervalLowSpeedRatio: null };
    }
    const sorted = [...speeds].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const medianRawSpeed = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    const avgRawSpeed = speeds.reduce((s, v) => s + v, 0) / speeds.length;
    const thr = driftConfig.lowSpeedThresholdKmh;
    const lowN = speeds.filter(s => s <= thr).length;
    const intervalLowSpeedRatio = lowN / speeds.length;
    return { avgRawSpeed, medianRawSpeed, intervalLowSpeedRatio };
  };

  const buildMergedIntervals = (rawIntervals) => {
    const normalizedRanges = normalizeIntervalRanges(rawIntervals, turnAngleSeries.length - 1);
    const mergedRanges = mergeIntervalRanges(normalizedRanges);
    const durationFilteredRanges = filterIntervalsByDuration(mergedRanges);
    return {
      rawCount: normalizedRanges.length,
      mergedCount: mergedRanges.length,
      durationFilteredCount: durationFilteredRanges.length,
      intervals: toColoredIntervals(durationFilteredRanges),
      spatialMergedRanges: mergedRanges
    };
  };

  const featureSeries = turnAngles.map((_, index) => {
    const { start, end } = getWindowRange(index, turnAngles.length, driftConfig.windowSize);
    const windowValues = turnAngles.slice(start, end + 1);
    const validValues = extractValidNumbers(windowValues);
    if (validValues.length < 3) {
      return {
        amp: 0,
        mad: 0,
        flipRate: 0,
        coherence: 0
      };
    }
    const absValues = validValues.map(value => Math.abs(value));
    return {
      amp: median(absValues),
      mad: calculateMad(validValues),
      flipRate: calculateFlipRate(validValues),
      coherence: calculateCoherence(validValues)
    };
  });
  const ampSeries = featureSeries.map(item => item.amp);
  const madSeries = featureSeries.map(item => item.mad);
  const flipRateSeries = featureSeries.map(item => item.flipRate);
  const zAmpSeries = zScoreSeries(ampSeries);
  const zMadSeries = zScoreSeries(madSeries);
  const zFlipRateSeries = zScoreSeries(flipRateSeries);
  const driftScoreSeries = featureSeries.map((item, index) => (
    zMadSeries[index] +
    zFlipRateSeries[index] +
    (1 - item.coherence) +
    zAmpSeries[index] * 0.5
  ));
  // 第3步：根据分布统计自动决定“分位阈值”还是“固定角度 fallback”。
  const thresholdMeta = buildDriftThresholdMeta(driftScoreSeries, turnAngleSeries, driftConfig, percentile);
  const {
    quantileHighThreshold,
    quantileLowThreshold,
    p10,
    p50,
    p90,
    spread,
    band,
    bandRatio,
    highScoreRatio,
    sufficientSamples,
    distributionDegraded,
    highnessGate,
    useFallback,
    thresholdMode,
    highThreshold,
    lowThreshold,
    fallbackReason,
    fallbackSignalSeries
  } = thresholdMeta;

  // 第4步：方向漂移状态机（与旧版一致，仅基于 driftScore 或 |turnAngle|）。
  const directionSignalSeries = useFallback ? fallbackSignalSeries : driftScoreSeries;
  const directionDriftIntervals = detectDriftIntervalsBySignal(
    directionSignalSeries,
    highThreshold,
    lowThreshold,
    driftConfig.startStreak,
    driftConfig.endStreak,
    pickDistinctRandomColor
  );

  // 低速窗口：与 driftScore 使用同一 windowSize；仅在开启低速候选时参与区间合并。
  const windowLowSpeedRatioSeries = [];
  const windowRawSpeedMedianSeries = [];
  const lowThr = driftConfig.lowSpeedThresholdKmh;
  const ratioThr = driftConfig.lowSpeedRatioThreshold;
  for (let wi = 0; wi < turnAngles.length; wi++) {
    const { start: ws, end: we } = getWindowRange(wi, turnAngles.length, driftConfig.windowSize);
    const speeds = [];
    for (let j = ws; j <= we; j++) {
      const gi = j + 1;
      if (gi >= 0 && gi < gpsPoints.length) {
        const rs = gpsPoints[gi].rawSpeed;
        if (Number.isFinite(rs)) speeds.push(rs);
      }
    }
    if (!speeds.length) {
      windowLowSpeedRatioSeries.push(0);
      windowRawSpeedMedianSeries.push(null);
      continue;
    }
    const lowCount = speeds.filter(s => s <= lowThr).length;
    windowLowSpeedRatioSeries.push(lowCount / speeds.length);
    windowRawSpeedMedianSeries.push(median(speeds));
  }

  const lowSpeedSignalSeries = driftConfig.lowSpeedCandidateEnabled
    ? windowLowSpeedRatioSeries.map(r => (r >= ratioThr ? 1 : 0))
    : windowLowSpeedRatioSeries.map(() => 0);

  const lowSpeedDriftIntervals = driftConfig.lowSpeedCandidateEnabled
    ? detectDriftIntervalsBySignal(
      lowSpeedSignalSeries,
      1,
      0,
      driftConfig.startStreak,
      driftConfig.endStreak,
      pickDistinctRandomColor
    )
    : [];

  let driftIntervals;
  if (!driftConfig.lowSpeedCandidateEnabled) {
    driftIntervals = directionDriftIntervals.map(iv => ({
      id: iv.id,
      startIndex: iv.startIndex,
      endIndex: iv.endIndex,
      color: iv.color,
      source: "direction",
      sources: ["direction"]
    }));
  } else {
    driftIntervals = mergeDirectionAndLowSpeedCandidateIntervals(
      directionDriftIntervals,
      lowSpeedDriftIntervals,
      pickDistinctRandomColor
    );
  }

  // displayColor / isDriftCandidate 仍只反映「方向漂移」原始识别，便于对照。
  const driftColorByIndex = Array(turnAngleSeries.length).fill(driftConfig.normalColor);
  const driftIntervalIdByIndex = Array(turnAngleSeries.length).fill(null);
  directionDriftIntervals.forEach(interval => {
    for (let i = interval.startIndex; i <= interval.endIndex; i++) {
      if (i >= 0 && i < turnAngleSeries.length) {
        driftColorByIndex[i] = interval.color;
        driftIntervalIdByIndex[i] = interval.id;
      }
    }
  });
  const mergedDriftResult = buildMergedIntervals(driftIntervals);
  const mergedDriftIntervalsRaw = mergedDriftResult.intervals;
  // 二次判定：对每个停留区间做 DBSCAN 密度打分，低于阈值则释放为普通点。
  // 关掉开关时直接跳过密度打分，所有合并区间都视作有效停留点。
  const densityScoredMergedIntervals = driftConfig.densityScoreEnabled
    ? scoreStopIntervalsByDensity(mergedDriftIntervalsRaw, gpsPoints, driftConfig)
    : mergedDriftIntervalsRaw.map((interval, index) => ({
        intervalId: interval.id || index + 1,
        interval,
        pointCount: 0,
        sampledPointCount: 0,
        densityMetrics: null,
        keepAsStop: true
      }));
  const mergedDriftIntervals = densityScoredMergedIntervals
    .filter(item => item.keepAsStop)
    .map(item => item.interval);
  const releasedMergedIntervalCount = densityScoredMergedIntervals.length - mergedDriftIntervals.length;
  const driftMergedColorByIndex = Array(turnAngleSeries.length).fill(driftConfig.normalColor);
  const driftMergedIntervalIdByIndex = Array(turnAngleSeries.length).fill(null);
  mergedDriftIntervals.forEach(interval => {
    for (let i = interval.startIndex; i <= interval.endIndex; i++) {
      if (i >= 0 && i < turnAngleSeries.length) {
        driftMergedColorByIndex[i] = interval.color;
        driftMergedIntervalIdByIndex[i] = interval.id;
      }
    }
  });
  let withPCount = 0;
  let parseOkCount = 0;
  gpsPoints.forEach(pt => {
    if (pt && pt.p !== undefined && pt.p !== null && String(pt.p).trim() !== "") withPCount++;
    if (pt && pt.pParseOk) parseOkCount++;
  });

  for (let i = 0; i < turnAngleSeries.length; i++) {
    turnAngleSeries[i].driftScore = Number(driftScoreSeries[i].toFixed(6));
    turnAngleSeries[i].windowAmp = Number(featureSeries[i].amp.toFixed(6));
    turnAngleSeries[i].windowMad = Number(featureSeries[i].mad.toFixed(6));
    turnAngleSeries[i].flipRate = Number(featureSeries[i].flipRate.toFixed(6));
    turnAngleSeries[i].coherence = Number(featureSeries[i].coherence.toFixed(6));
    turnAngleSeries[i].thresholdMode = thresholdMode;
    turnAngleSeries[i].fallbackSignal = Number(fallbackSignalSeries[i].toFixed(6));
    turnAngleSeries[i].isDriftCandidate = driftIntervalIdByIndex[i] !== null;
    turnAngleSeries[i].driftIntervalId = driftIntervalIdByIndex[i];
    turnAngleSeries[i].displayColor = driftColorByIndex[i];
    turnAngleSeries[i].driftMergedIntervalId = driftMergedIntervalIdByIndex[i];
    turnAngleSeries[i].driftMergedColor = driftMergedColorByIndex[i];
    turnAngleSeries[i].isDriftMergedCandidate = driftMergedIntervalIdByIndex[i] !== null;

    const mid = gpsPoints[i + 1];
    turnAngleSeries[i].rawSpeed = mid && Number.isFinite(mid.rawSpeed) ? mid.rawSpeed : null;
    turnAngleSeries[i].rawDirection = mid && Number.isFinite(mid.rawDirection) ? mid.rawDirection : null;
    turnAngleSeries[i].hdop = mid && Number.isFinite(mid.hdop) ? mid.hdop : null;
    turnAngleSeries[i].vdop = mid && Number.isFinite(mid.vdop) ? mid.vdop : null;
    turnAngleSeries[i].satelliteCount = mid && Number.isFinite(mid.satelliteCount) ? mid.satelliteCount : null;
    turnAngleSeries[i].windowLowSpeedRatio = Number(windowLowSpeedRatioSeries[i].toFixed(6));
    turnAngleSeries[i].windowLowSpeedRatioPct = Number((windowLowSpeedRatioSeries[i] * 100).toFixed(2));
    turnAngleSeries[i].windowRawSpeedMedian = windowRawSpeedMedianSeries[i] != null
      ? Number(windowRawSpeedMedianSeries[i].toFixed(4))
      : null;
    const isLowSpeedCandidate = driftConfig.lowSpeedCandidateEnabled
      && windowLowSpeedRatioSeries[i] >= ratioThr;
    turnAngleSeries[i].isLowSpeedCandidate = isLowSpeedCandidate;
    const isDir = driftIntervalIdByIndex[i] !== null;
    if (isDir && isLowSpeedCandidate) {
      turnAngleSeries[i].candidateReason = "direction+low_speed";
    } else if (isDir) {
      turnAngleSeries[i].candidateReason = "direction";
    } else if (isLowSpeedCandidate) {
      turnAngleSeries[i].candidateReason = "low_speed";
    } else {
      turnAngleSeries[i].candidateReason = "";
    }
  }

  let directionCandidatePoints = 0;
  let lowSpeedCandidatePoints = 0;
  let mergedCandidatePoints = 0;
  let lowSpeedOnlyPoints = 0;
  for (let i = 0; i < turnAngleSeries.length; i++) {
    if (turnAngleSeries[i].isDriftCandidate) directionCandidatePoints++;
    if (turnAngleSeries[i].isLowSpeedCandidate) lowSpeedCandidatePoints++;
    if (turnAngleSeries[i].isDriftMergedCandidate) mergedCandidatePoints++;
    if (turnAngleSeries[i].isLowSpeedCandidate && !turnAngleSeries[i].isDriftCandidate) lowSpeedOnlyPoints++;
  }

  const driftObservationSummary = {
    lowSpeedCandidateEnabled: driftConfig.lowSpeedCandidateEnabled,
    lowSpeedThresholdKmh: driftConfig.lowSpeedThresholdKmh,
    lowSpeedRatioThreshold: driftConfig.lowSpeedRatioThreshold,
    withPCount,
    parseOkCount,
    parseSuccessRatio: withPCount ? Number((parseOkCount / withPCount).toFixed(4)) : null,
    directionCandidatePoints,
    lowSpeedCandidatePoints,
    mergedCandidatePoints,
    lowSpeedOnlyPoints
  };

  const spatialRows = (mergedDriftResult.spatialMergedRanges || []).map((r, idx) => {
    const snap = buildIntervalSnapshot(r);
    const st = computeIntervalRawSpeedStats(r);
    return {
      idx: idx + 1,
      source: deriveIntervalSourceLabel(r.sources),
      startIndex: r.startIndex,
      endIndex: r.endIndex,
      startTime: snap?.startTime || null,
      endTime: snap?.endTime || null,
      durationMinutes: snap ? Number((snap.durationMs / 60000).toFixed(2)) : null,
      avgRawSpeed: st.avgRawSpeed != null ? Number(st.avgRawSpeed.toFixed(2)) : null,
      medianRawSpeed: st.medianRawSpeed != null ? Number(st.medianRawSpeed.toFixed(2)) : null,
      intervalLowSpeedRatio: st.intervalLowSpeedRatio != null ? Number(st.intervalLowSpeedRatio.toFixed(4)) : null
    };
  });

  console.log("低速候选识别统计", {
    ...driftObservationSummary,
    directionIntervalCount: directionDriftIntervals.length,
    lowSpeedIntervalCount: lowSpeedDriftIntervals.length,
    combinedIntervalCount: driftIntervals.length
  });
  console.log("候选区间来源对照（空间合并后、时长过滤前）");
  console.table(spatialRows);

  console.log("角度漂移观测-向量x轴夹角序列", vectorAngleFromXAxisSeries);
  console.log("角度漂移观测-相邻向量夹角序列", turnAngleSeries);
  console.log("角度漂移观测-阈值模式", {
    thresholdMode,
    useFallback,
    fallbackReason
  });
  console.log("角度漂移观测-退化识别统计", {
    p10,
    p50,
    p90,
    spread,
    band,
    bandRatio,
    highScoreRatio,
    sufficientSamples,
    distributionDegraded,
    highnessGate
  });
  console.log("角度漂移观测-区间阈值", {
    highThreshold,
    lowThreshold,
    quantileHighThreshold,
    quantileLowThreshold
  });
  console.log("角度漂移观测-方向漂移原始识别区间", directionDriftIntervals);
  console.log("角度漂移观测-低速候选识别区间", lowSpeedDriftIntervals);
  console.log("角度漂移观测-合并候选区间（方向∪低速，索引轴）", driftIntervals);
  console.log("角度漂移观测-规则区间后处理统计", {
    rawCount: mergedDriftResult.rawCount,
    mergedCount: mergedDriftResult.mergedCount,
    durationFilteredCount: mergedDriftResult.durationFilteredCount,
    densityFilteredCount: mergedDriftIntervals.length,
    releasedAsNormalCount: releasedMergedIntervalCount
  });
  console.log("角度漂移观测-规则合并过滤区间", mergedDriftIntervals);

  // 基于“规则阈值合并+30分钟过滤后区间（主参考）”做 DBSCAN 密度观测与二次判定日志。
  if (config.openDebug) {
    densityScoredMergedIntervals.forEach(item => {
      console.log("停留区间DBSCAN密度观测", {
        intervalId: item.intervalId,
        startTime: item.interval.startTime || null,
        endTime: item.interval.endTime || null,
        pointCount: item.pointCount,
        sampledPointCount: item.sampledPointCount,
        epsMeters: driftConfig.densityEpsMeters,
        minPts: driftConfig.densityMinPts,
        sampleTriggerCount: driftConfig.densitySampleTriggerCount,
        maxPoints: driftConfig.densityMaxPoints,
        densityScoreThreshold: driftConfig.densityScoreThreshold,
        keepAsStop: item.keepAsStop,
        ...(item.densityMetrics || {})
      });
    });
  }

  return {
    vectorAngleFromXAxisSeries,
    turnAngleSeries,
    driftIntervals,
    mergedDriftIntervals,
    thresholdMeta: {
      thresholdMode,
      useFallback,
      fallbackReason,
      highThreshold,
      lowThreshold,
      quantileHighThreshold,
      quantileLowThreshold,
      p10,
      p50,
      p90,
      spread,
      band,
      bandRatio,
      highScoreRatio,
      sufficientSamples,
      distributionDegraded,
      highnessGate,
      densityScoreThreshold: driftConfig.densityScoreThreshold,
      densityFilteredCount: mergedDriftIntervals.length,
      releasedAsNormalCount: releasedMergedIntervalCount,
      driftObservationSummary
    }
  };
}

/**
 * 用 DBSCAN（基于半径邻域）给一组点做聚类。
 * 这是一个只用于“密度观测打分”的轻量实现，不会参与任何业务判定。
 * @param {Array<{lat:number,lng:number}>} points 点集
 * @param {number} epsMeters 邻域半径（米）
 * @param {number} minPts 最小核心点邻居数
 * @returns {{labels:number[],clusters:number[][],noiseIndices:number[]}}
 */
function runDbscan(points, epsMeters, minPts) {
  const labels = Array(points.length).fill(undefined); // undefined: 未访问, -1: 噪声, >=0: clusterId
  const visited = Array(points.length).fill(false);
  const clusters = [];

  const regionQuery = (index) => {
    const neighbors = [];
    for (let i = 0; i < points.length; i++) {
      if (calculateDistance(points[index], points[i]) <= epsMeters) {
        neighbors.push(i);
      }
    }
    return neighbors;
  };

  const expandCluster = (seedIndex, seedNeighbors, clusterId) => {
    clusters[clusterId] = [];
    labels[seedIndex] = clusterId;
    clusters[clusterId].push(seedIndex);
    const queue = [...seedNeighbors];

    while (queue.length) {
      const current = queue.shift();
      if (!visited[current]) {
        visited[current] = true;
        const currentNeighbors = regionQuery(current);
        if (currentNeighbors.length >= minPts) {
          queue.push(...currentNeighbors);
        }
      }
      if (labels[current] === undefined || labels[current] === -1) {
        labels[current] = clusterId;
        clusters[clusterId].push(current);
      }
    }
  };

  for (let i = 0; i < points.length; i++) {
    if (visited[i]) continue;
    visited[i] = true;
    const neighbors = regionQuery(i);
    if (neighbors.length < minPts) {
      labels[i] = -1;
      continue;
    }
    const clusterId = clusters.length;
    expandCluster(i, neighbors, clusterId);
  }

  const noiseIndices = labels
    .map((label, index) => ({ label, index }))
    .filter(item => item.label === -1)
    .map(item => item.index);

  return { labels, clusters, noiseIndices };
}

/**
 * 把 DBSCAN 结果转成便于肉眼判断的密度指标。
 * 这些指标只打印日志，不回写业务流程。
 * @param {Array<{lat:number,lng:number}>} points
 * @param {{clusters:number[][],noiseIndices:number[]}} dbscanResult
 * @returns {{clusterCount:number,noiseCount:number,maxClusterSize:number,clusteredRatio:number,maxClusterRatio:number,densityScore:number}}
 */
function buildDensityScore(points, dbscanResult) {
  const total = points.length || 1;
  const clusterSizes = (dbscanResult.clusters || []).map(cluster => cluster.length);
  const clusterCount = clusterSizes.length;
  const maxClusterSize = clusterSizes.length ? Math.max(...clusterSizes) : 0;
  const noiseCount = (dbscanResult.noiseIndices || []).length;
  const clusteredRatio = (total - noiseCount) / total;
  const maxClusterRatio = maxClusterSize / total;
  const densityScore = Number((0.7 * maxClusterRatio + 0.3 * clusteredRatio).toFixed(6));
  return {
    clusterCount,
    noiseCount,
    maxClusterSize,
    clusteredRatio: Number(clusteredRatio.toFixed(6)),
    maxClusterRatio: Number(maxClusterRatio.toFixed(6)),
    densityScore
  };
}

/**
 * DBSCAN 是 \(O(n^2)\) 的，点一多就很卡。
 * 这里做一个“均匀抽样（uniform sampling）”的小工具：如果点数超过上限，就均匀取 maxPoints 个点。
 * 这样能尽量保留时间/空间上的整体形状，又能把计算量压住。
 * @param {Array<any>} points
 * @param {number} sampleTriggerCount
 * @param {number} maxPoints
 * @returns {Array<any>}
 */
function samplePointsUniformly(points, sampleTriggerCount, maxPoints) {
  if (!Array.isArray(points)) return [];
  if (!Number.isFinite(maxPoints) || maxPoints <= 0) return points;
  if (!Number.isFinite(sampleTriggerCount) || sampleTriggerCount <= 0) return points;
  if (points.length <= sampleTriggerCount) return points;
  const step = (points.length - 1) / (maxPoints - 1);
  const sampled = [];
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round(i * step);
    sampled.push(points[idx]);
  }
  return sampled;
}

/**
 * 对每个停留区间做 DBSCAN 密度打分作为“二次判定”。
 * 低于阈值则视作普通点段，由调用方决定是否释放。
 * @param {Array<{startIndex:number,endIndex:number,id?:number}>} mergedIntervals 一次合并后的停留区间
 * @param {Array<{lat:number,lng:number}>} gpsPoints 原始 GPS 点序列
 * @param {{densitySampleTriggerCount:number,densityMaxPoints:number,densityEpsMeters:number,densityMinPts:number,densityScoreThreshold:number}} driftConfig 漂移观测配置
 * @returns {Array<{intervalId:number,interval:object,pointCount:number,sampledPointCount:number,densityMetrics:object,keepAsStop:boolean}>}
 */
function scoreStopIntervalsByDensity(mergedIntervals, gpsPoints, driftConfig) {
  return mergedIntervals.map((interval, index) => {
    const gpsStartIndex = Math.max(0, Math.min(gpsPoints.length - 1, interval.startIndex));
    const gpsEndIndex = Math.max(
      gpsStartIndex,
      Math.min(gpsPoints.length - 1, interval.endIndex + 2)
    );
    const stopSegmentPoints = gpsPoints.slice(gpsStartIndex, gpsEndIndex + 1);
    const sampledPoints = samplePointsUniformly(
      stopSegmentPoints,
      driftConfig.densitySampleTriggerCount,
      driftConfig.densityMaxPoints
    );
    const dbscanResult = runDbscan(sampledPoints, driftConfig.densityEpsMeters, driftConfig.densityMinPts);
    const densityMetrics = buildDensityScore(sampledPoints, dbscanResult);
    return {
      intervalId: interval.id || index + 1,
      interval,
      pointCount: stopSegmentPoints.length,
      sampledPointCount: sampledPoints.length,
      densityMetrics,
      keepAsStop: densityMetrics.densityScore >= driftConfig.densityScoreThreshold
    };
  });
}

/**
 * 寻找停留点
 * @param {*} gpsPoints 
 * @returns 
 */
async function optimize(riginalGpsPoints) {

  let gpsPoints = normalizeGpsPointsWithPayload(riginalGpsPoints);
  //去除噪点
  gpsPoints = noiseRecognitionFilter(gpsPoints);

  const {
    turnAngleSeries,
    mergedDriftIntervals,
    thresholdMeta: driftObservationMeta
  } = observeStopPointDirectionDrift(gpsPoints);

  // 第一阶段：----------------------------------------------寻找停留点
  var finalPoints = []; // 存储最终的轨迹点（混合语义：普通点保留，停留段替换成质心）

  // 这里我们完全改用 observeStopPointDirectionDrift 的 mergedDriftIntervals 做停留主参考。
  // 注意索引映射：区间索引来自 turnAngleSeries，映射回 gpsPoints 时 endIndex 需要 +2。
  const normalizedDriftIntervals = (mergedDriftIntervals || [])
    .map((interval, index) => {
      const gpsStartIndex = Math.max(0, Math.min(gpsPoints.length - 1, interval.startIndex));
      const gpsEndIndex = Math.max(
        gpsStartIndex,
        Math.min(gpsPoints.length - 1, interval.endIndex + 2)
      );
      return {
        intervalId: interval.id || index + 1,
        startTime: interval.startTime || null,
        endTime: interval.endTime || null,
        gpsStartIndex,
        gpsEndIndex
      };
    })
    .sort((a, b) => a.gpsStartIndex - b.gpsStartIndex);

  let cursor = 0;
  for (const interval of normalizedDriftIntervals) {
    // 先把停留区间前面的普通轨迹点原样塞回去，保证“非停留点保留”。
    if (interval.gpsStartIndex > cursor) {
      finalPoints.push(...gpsPoints.slice(cursor, interval.gpsStartIndex));
    }

    // 停留区间本身用一个质心点替换，避免整段点都堆到 finalPoints。
    const segmentStart = Math.max(cursor, interval.gpsStartIndex);
    const segmentEnd = interval.gpsEndIndex;
    if (segmentEnd >= segmentStart) {
      const stopSegmentPoints = gpsPoints.slice(segmentStart, segmentEnd + 1);
      if (stopSegmentPoints.length) {
        const centerPoint = calculateGeographicalCenter(stopSegmentPoints);
        finalPoints.push(centerPoint);
      }
      cursor = Math.max(cursor, segmentEnd + 1);
    }
  }

  // 把最后一个停留区间之后的普通点补回去。
  if (cursor < gpsPoints.length) {
    finalPoints.push(...gpsPoints.slice(cursor));
  }
  
  
  // 第二阶段：----------------------------------------------初步获取停留点、总里程、平均速度以及参数自动调优过程

  //把停留点从坐标中单独提出来
  let stopPoints = []
  stopPoints = dismantleStopPoint(finalPoints)

  //计算速度和里程
  let totalMileage = await calculateSpeedAndMileage(finalPoints)
  //给轨迹里程赋初值
  let trajectoryMileage = totalMileage 

  let avgSpeed = calculateAvgSpeed(totalMileage,
    calculateMilliseconds(finalPoints[0].currentTime,finalPoints[finalPoints.length-1].currentTime)/1000)
  
  // 第三阶段：----------------------------------------------轨迹补偿。
  // 土豪玩家根据配置的高德key和谷歌key。对点距超过平均值50的点自动进行两轮车路径规划补点。
  // 效果极佳。但是注意两个问题：1、是两轮车路径规划。请根据自己的场景决定要不要启用；2、数据失真。对数据真实性要求高的用户不要启用。

  // 停留点前后点位的轨迹补偿（需要使用API调用地图能力进行，会产生额外的费用）
  if(config.smoothness && finalPoints.length>3){
    //如果平均速度高于15公里（缺省值）每小时，则不进行轨迹补偿过渡。过快的速度在进行轨迹补偿时会和实际轨迹相差巨大
    if(avgSpeed<config.smoothnessLimitAvgSpeed){
      finalPoints = await smoothness(finalPoints)
    }
  }
  
  // 第四阶段：----------------------------------------------使用IQR算法剔除点距异常大的点（剔毛刺）
  //找到里程异常大的点。剔除它。
  //核心的作用是剔除轨迹中的极端偏移毛刺。
  let mileageOutliers = detectMileageOutliers(finalPoints,config.IQRThreshold)
  let abnormalIdentification = false //异常识别是否失效
  //若异常点占比过多。则判定异常点识别功能失效或不适合此轨迹
  //统计异常点mileageOutliers占比是否超过一定比例。超过则判定异常点识别功能失效或不适合此轨迹。第五步将不会再进行处理。
  //第四步是剔除毛刺，删除点并不会改变轨迹的大致形状。故不用取消此步骤
  if(mileageOutliers.length>0 && mileageOutliers.length/finalPoints.length>config. abnormalPointRatio){
    if(config.openDebug){
      console.log(`异常点占比${mileageOutliers.length/finalPoints.length}超过${config. abnormalPointRatio}。异常点识别功能失效或不适合此轨迹`)
    }
    abnormalIdentification = true
  }

  // 过滤掉里程小于distanceThreshold*2的异常点下标
  mileageOutliers = mileageOutliers.filter(index => {
    return finalPoints[index].mileage > config.distanceThreshold * 2
  })
  if(mileageOutliers.length>0){
    finalPoints = removeIndices(finalPoints,mileageOutliers)
  }

  //因为剔除了异常点所以要再次计算速度和里程。这个计算同时会计算点和点之间的速度与里程。不可以省略
  totalMileage = await calculateSpeedAndMileage(finalPoints)
  
  // 初始化轨迹渲染点数组
  let trajectoryPoints = []
  // 对轨迹进行颜色渲染。根据轨迹的速度不同，自适应颜色进行渲染
  if(config.pathColorOptimize && finalPoints.length>0){
    trajectoryPoints = await processTrajectory(finalPoints)
  }

  if(!abnormalIdentification){
    // 第五阶段：----------------------------------------------使用IQR算法再次寻找里程极大点。并从异常点处进行切割
    //某些偏移是行经中某一段信号丢失（隧道没信号、设备重启等）导致的点跨越极大的距离导致。这时删除不能解决问题。而是拆分轨迹。进行分别渲染或者虚化渲染
    // 核心的作用是把轨迹中的异常点（信号丢失导致的点跨越极大的距离）从异常点处进行切割。
    // 这样做的好处是：1、可以把异常点处的轨迹片段单独渲染。2、可以把异常点处的轨迹片段虚化渲染。3、可以把异常点处的轨迹片段单独渲染。

    let mileageOutliersCut = detectMileageOutliers(finalPoints,config.IQRThreshold)
    //根据mileageOutliersCut异常点下标把finalPoints切割成一个包含多个轨迹段的二维数组。
    let finalPointsSegments= []
    let trajectoryPointsSegments=[]
    if(mileageOutliersCut.length>0 ){//存在异常点
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

    // 第六阶段（最后）：----------------------------------------------轨迹拼接
    // 核心作用：1、得到处理后没有异常点的完整轨迹；2、异常轨迹段落前后的虚拟化处理；3、重新计算更加准确的平均速度和总里程。

    //基于finalPointsSegments和trajectoryPointsSegments把轨迹再次拼接起来刷新finalPoints完整轨迹
    //目的是通过IQR去除异常点后，需要对完整轨迹进行刷新保证后面计算的平均速度和总里程更加准确
    const mergedTrajectories = mergeTrajectorySegments(finalPointsSegments, trajectoryPointsSegments);
    finalPoints = mergedTrajectories.finalPoints;
    trajectoryPoints = mergedTrajectories.trajectoryPoints;

    // 重新计算平均速度和总里程。通过分段计算每个轨迹的平均速度和总里程，最后再进行累加
    // 这样做会让平均速度和总里程更加精准。因为分段轨迹已经去掉了异常点和中途信号丢失的轨迹片段
    if(finalPointsSegments.length>1){
      trajectoryMileage = await calculateMultipleTrajectoryMileage(finalPointsSegments)
      totalMileage = await calculateSpeedAndMileage(finalPoints)
      avgSpeed = calculateAvgSpeed(totalMileage,
        calculateMilliseconds(finalPoints[0].currentTime,finalPoints[finalPoints.length-1].currentTime)/1000)
    }
  }
  

  //此时轨迹处理结束。由于降噪的原因，需要重新获取还存在的停留点。
  stopPoints = dismantleStopPoint(finalPoints)

  //轨迹分段信息
  let segmentInfo = generateSegmentInfo(finalPoints)
  let moveAvgSpeed = 0
  if(segmentInfo){
    let _totalMileage = 0
    let _totalTime = 0
    for(let item of segmentInfo){
      if(item.type=='motion'){
        _totalMileage += item.distanceLong
        _totalTime += item.durationLong
      }
    }
    moveAvgSpeed = calculateAvgSpeed(_totalMileage,_totalTime/1000)
  }

  // 返回处理后的轨迹点数组
  return {
    "turnAngleSeries":turnAngleSeries,
    driftObservationMeta,
    "finalPoints": finalPoints,//优化后的轨迹
    "trajectoryPoints":trajectoryPoints,//优化后根据速度进行拆分的轨迹信息
    "stopPoints" : stopPoints,//所有的停留点
    "center":calculateCentroid(finalPoints),//中心点
    'zoom':calculateZoom(calculateBoundingBox(finalPoints), config.mapWidth, config.mapHeight),//缩放比
    "segmentInfo":segmentInfo,//分段信息
    "startPoint":finalPoints[0],//开始点
    "endPoint":finalPoints[finalPoints.length-1],//结束点
    "samplePoints":samplePoints(finalPoints),//轨迹抽样数据（固定数量）
    "avgSpeed":avgSpeed,
    "moveAvgSpeed":moveAvgSpeed,
    "totalMileage":totalMileage,
    "trajectoryMileage":trajectoryMileage
  }; 
}

/**
 * 计算平均速度
 * @param {*} totalMileage 总里程（米）
 * @param {*} second 时间间隔（秒）
 * @returns 平均速度（km/h）
 */
function calculateAvgSpeed(totalMileage,second) {
  return Number((totalMileage/second)*3.6).toFixed(2)
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
        // 构造虚线连接相邻段。要保证currentTime有值。否则卡片信息可能会出现无法计算运动和停留时长的问题
        let driftPath = [
          {
            lng: afterPathSegmentPath[afterPathSegmentPath.length-1].lng,
            lat: afterPathSegmentPath[afterPathSegmentPath.length-1].lat,
            currentTime:afterPathSegmentPath[afterPathSegmentPath.length-1].currentTime
          },
          {
            lng: currentPathSegmentPath[0].lng,
            lat: currentPathSegmentPath[0].lat,
            currentTime:currentPathSegmentPath[0].currentTime
          }
        ];
        finalPoints = finalPoints.concat(driftPath);
      }
      finalPoints = finalPoints.concat(currentPathSegmentPath);
    }

    // 合并trajectoryPoints并添加连接线
    for (let i = 0; i < trajectoryPointsSegments.length; i++) {
      let afterPathSegment = trajectoryPointsSegments[i-1];
      let currentPathSegment = trajectoryPointsSegments[i];
      
      if (i > 0 && i < trajectoryPointsSegments.length) {
        let afterPoints = afterPathSegment[afterPathSegment.length-1];
        let currenPoints = currentPathSegment[0];

        let afterPath = afterPoints.path;
        let currentPath = currenPoints.path;
        
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
          type: 'drift',
          currentTime:afterPath[afterPath.length-1].currentTime
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

  //如果是停留点则不删除
  return data
    .map((point, index) => (point.mileage > threshold && !point.stopTimeSecondsLong ? index : -1))
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
    const stopTimeSecondsLong = calculateMilliseconds(points[0].currentTime,points[points.length-1].currentTime)
    return {
        lat: radiansToDegrees(latAvg),//纬度
        lng: radiansToDegrees(lngAvg),//经度
        currentTime:points[points.length-1].currentTime,//GPS点上报时间
        startPosition:points[0],//开始停留时的GPS点
        endPosition:points[points.length-1],//结束停留时的GPS点
        startTime:points[0].currentTime,//停留开始时间
        endTime:points[points.length-1].currentTime,//结束停留时间
        stopTimeSecondsLong:stopTimeSecondsLong,//停留时间的毫秒值
        stopTimeSeconds:formatMilliseconds(stopTimeSecondsLong)//停留时间
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
  let result = [];
  let movementStart = null; // 用于记录运动开始的点
  let currentPath = []; // 用于记录当前运动段的路径

  let totalDistance = 0; // 用于累加运动段中的距离
  let totalTime = 0; // 用于累加运动段中的时间

  positions.forEach((position, index) => {
    // 判断是否是停留点
    if (position.startPosition && position.endPosition) {
      // 如果之前有运动点，先将运动段添加到结果中
      if (movementStart != null) {
        let duration = calculateMilliseconds(
          positions[index - 1].currentTime,
          movementStart.currentTime
        );
        const avgSpeed = (totalDistance / totalTime * 3.6).toFixed(2) // 计算平均速度

        result.push({
          type: "motion",
          path: currentPath, // 添加当前路径
          startPosition: movementStart,
          endPosition: {
            lat: positions[index - 1].lat,
            lng: positions[index - 1].lng,
          },
          duration: formatMilliseconds(duration), // 计算运动持续时间
          durationLong:duration,
          startTime: movementStart.currentTime,
          endTime: positions[index - 1].currentTime,
          distance: formatDistance(totalDistance), // 累加距离
          distanceLong:totalDistance,
          averageSpeed: `${avgSpeed} km/h`, // 平均速度
        });

        movementStart = null; // 重置运动开始点
        currentPath = []; // 重置当前路径

        totalDistance = 0; // 重置总距离
        totalTime = 0; // 重置总时间
      }

      // 处理停留点
      result.push({
        type: "stopped",
        startPosition: position.startPosition,
        endPosition: position.endPosition,
        duration: position.stopTimeSeconds,
        startTime: position.startTime,
        endTime: position.endTime,
        distance: 0, // 停留时距离为 0
      });
    } else {
      // 如果是运动点
      if (!movementStart) {
        movementStart = {...position};
        currentPath.push(movementStart); // 添加当前点到路径中
      } else {
        // 累加每个点之间的距离，并限制为2位小数
        totalDistance += parseFloat(
          calculateDistance(
            { lat: positions[index - 1].lat, lng: positions[index - 1].lng },
            { lat: position.lat, lng: position.lng }
          )
        );
        totalTime += calculateMilliseconds(position.currentTime, positions[index - 1].currentTime)/1000;
        currentPath.push({...position}); // 添加当前点到路径中
      }
    }
  });

  // 处理最后一段运动，如果最后一个点是运动点
  if (movementStart) {
      const lastPosition = positions[positions.length - 1];
      let duration = calculateMilliseconds(lastPosition.currentTime, movementStart.currentTime);
      const avgSpeed = (totalDistance / totalTime * 3.6).toFixed(2)
      
      result.push({
          type: 'motion',
          startPosition: movementStart,
          endPosition: { lat: lastPosition.lat, lng: lastPosition.lng },
          duration: formatMilliseconds(duration), // 计算运动持续时间
          durationLong:duration,
          startTime: movementStart.currentTime,
          endTime: lastPosition.currentTime,
          distance: formatDistance(totalDistance), // 累加最后的总距离
          distanceLong:totalDistance,
          averageSpeed: `${avgSpeed} km/h` // 平均速度
      });
  }

  //由于降噪的原因，会导致停留点的开始时间和结束时间与实际不符。
  //需要重新获取停留点的开始时间和结束时间和持续时间
  //计算逻辑是：识别出当前点若是停留点，那么它的开始时间就是上一个点的结束时间，结束时间就是下一个点的开始时间。
  // 如果第一个点就是停留点只用和下个点的开始时间对齐。最后一个点则开始时间和上一个点的结束时间对齐
  result.forEach((item, index) => {
    if (item.type === 'stopped') {
      // 处理startTime和startPosition
      if (index != 0) {
        // 非第一个点，使用上一个点的结束时间
        item.startTime = result[index - 1].endTime;
        // 处理startPosition
        item.startPosition = result[index - 1].endPosition;
      }
      
      // 处理endTime
      if (index != result.length - 1) {
        // 非最后一个点，使用下一个点的开始时间
        item.endTime = result[index + 1].startTime;
        // 处理endPosition
        item.endPosition = result[index + 1].startPosition;
      }
      
      // 重新计算停留时间（秒）
      item.stopTimeSeconds = formatMilliseconds(calculateMilliseconds(item.startTime, item.endTime));
    }
  });

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
    return (distance/ timeDiff)*3.6; // 速度（公里/小时）
  }
  return 0;
}

/**
 * 计算轨迹点的速度和里程
 * @param {Array} points 轨迹点数组
 * @returns {Number} 总里程（米）
 */
async function calculateSpeedAndMileage(points) {
  let totalMileage = 0
  for (let i = 0; i < points.length-1; i++) {
    //速度
    if(points[i].type=='add'||points[i].type=='drift' || points[i+1].type=='add'||points[i+1].type=='drift'){//如果两个点都是添加进去的点，那就不计算速度
      points[i].speed=0;
      continue
    }else{
      let speed = await calculateSpeed(points[i], points[i + 1])
      points[i].speed=speed;
      if(speed<config.limitSpeed){
        points[i].speed=speed;
      }else{
        points[i].speed=0;
        //速度异常的话可能是漂移点，所以往后走计算总里程了
        continue
      }
      
    }
    //里程
    let mileage = calculateDistance(points[i], points[i + 1])
    points[i].mileage=mileage;
    totalMileage+=parseFloat(mileage)
  }
  return Number((totalMileage).toFixed(2));
}

/**
 * 并行计算多条轨迹的总里程并返回总和
 * @param {Array<Array>} trajectories 多条轨迹点数组的数组
 * @returns {Number} 所有轨迹的总里程之和（米）
 */
async function calculateMultipleTrajectoryMileage(trajectories) {
  // 记录开始时间
  const startTime = Date.now()
  
  // 使用Promise.all并行处理多条轨迹
  const mileageResults = await Promise.all(
    trajectories.map(async (trajectory) => {
      return await calculateSpeedAndMileage(trajectory)
    })
  )
  
  // 计算所有轨迹的总里程之和
  const totalMileage = mileageResults.reduce((sum, mileage) => sum + parseFloat(mileage), 0)
  
  // 计算耗时并输出日志
  const endTime = Date.now()
  const timeSpent = endTime - startTime
  if(config.openDebug){
    console.debug(`并行计算${trajectories.length}条轨迹的速度和里程完成,总里程${totalMileage}米,共耗时${timeSpent}毫秒`)
  }

  return totalMileage.toFixed(2);
}

/**
 * 计算速度的四分位数范围（IQR），并过滤出在这个范围内的速度值。
 * @param {Array} Speeds 速度数组（单位：公里/小时）
 * @returns {Array} 过滤后的速度数组，只包含在IQR范围内的速度值
 */
function speedFilterIQR(Speeds) {
  const sorted = [...Speeds].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lower = q1 - config.speedIQRThreshold * iqr;
  const upper = q3 + config.speedIQRThreshold * iqr;
  return Speeds.filter(x => x >= lower && x <= upper);
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