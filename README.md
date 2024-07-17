# 介绍
专为设备上报的GPS点渲染轨迹而设计。优化GPS坐标轨迹。包括计算停止点、停留时间、停留时间、行驶里程等信息

# 核心功能介绍
- 【重点】自动识别停留点
- 【重点】密集停留点降噪
- 【重点】卡片式信息展示
- 【重点】停留点平滑处理（需要配置高德密钥。国外需要配置Google Map密钥）
- 使用门槛低，傻瓜式调用
- 支持国家化
- 高灵活性。提供多达10个参数的个性化设置
- 【重点】参数自适应优化策略。根据不同轨迹自适应调整部分参数

# 停留点计算原理
## 理论依据
连续的GPS点中，静止不动的一段或者多段这样的点序列。把这些点序列处理成一个点，也就是拿这些序列的第一个点即可。理论依据如下：从第二个点开始，每个点都和第一个点进行距离计算和比较。至少比较N个点。当百分之M的点距离在X内的话，就继续计算比对。直到后面Z个连续点超出X，那么第一个点到超出X的第一个点，也就是Z的第一个点之前的点认为是静止状态。则这个序列被认为是静止的GPS序列，取停止点的中心点即可。后面从继续从Z的第一个点循环做这件事儿。若点不足N个，则不做任何处理

![stoppoint.png](/doc/stoppoint.png)
在连续的GPS序列中，假设前半段静止，后半段运动。则后序所有点和第一个点进行距离计算后和时间的关系图如上。静止的点拟合后的结果一定是平行于X轴的，后半段的拟合在匀速的情况下，是一个0<角度<90度的线（变速运动的话时拟合的是曲线）

## 停留中心点计算
识别出停留点轨迹序列后，需要计算这些点的中心点，当作停留点。算法如下：
![centerpoint.png](/doc/centerpoint.png)

# 停留点平滑处理原理
// TODO

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
## 配置（默认值）
``` javascript
GpsPathTransfigure.conf({
    minComparisonPoints : 10, // 最少比较的点数
    distanceThresholdPercentage : 90, // 距离阈值内的点的百分比
    distanceThreshold : 35, // 距离阈值，单位为米
    stationaryEndPoints : 10, // 判断静止状态结束的连续点数
    proximityStopThreshold:35,// 近距离停留点阈值。此值通常要大于等于distanceThreshold
    proximityStopMerge:false,// 近距离停留点合并。建议默认开启
    format : true,//是否格式化数据内容。如里程、时间信息。若开启则根据locale配置输出对应国家语言的信息的内容
    locale : 'zh'//设置语言
})
```
## 使用
``` javascript
var gpsPoint =[
......
{lon: 14.3908478, lat: 38.3038816, currentTime: '2024-06-27 01:43:36'},
{lon: 114.3908478, lat: 38.3038816, currentTime: '2024-06-27 01:46:35'},
{lon: 114.3906792, lat: 38.3037608, currentTime: '2024-06-27 01:47:50'},
{lon: 114.3906634, lat: 38.3037528, currentTime: '2024-06-27 01:47:55'},
......
]

const staticPoints = GpsPathTransfigure.optimize(gpsPoint);
const finalPoints = staticPoints.finalPoints
const stopPoints = staticPoints.stopPoints
```
代码中直接使用finalPoints渲染轨迹即可。若想要渲染停留点大头针效果，则渲染所有的stopPoints即可

# 问题交流反馈或issues
 QQ：914245697