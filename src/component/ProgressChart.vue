<template>
    <div class="chart-container" ref="chartContainer">
      <canvas id="speed-chart"></canvas>
      <div id="slider" class="slider">
        <div v-if="dynamicMileage!=0" class="bubble">{{dynamicMileage}}</div>
        <img :src="sliderImage" alt="Slider Handle" />
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, watch, onMounted, onUnmounted } from 'vue';
  import  moment from "moment"
  
  // 接收数据
  const props = defineProps({
        data: {
            type: Array,
            required: true,
            default: () => []
        },
        sliderImage: {
            type: String,
            required: true
        },
        onMove: {
            type: Function, // 拖动时的回调函数
            required: false
        },
        setPosition: {
            type: Number, // 控制滑块位置的下标
            required: false
        }
    });

    watch(() => props.setPosition, (newIndex) => {
        if (newIndex !== undefined) {
            setSliderPositionByIndex(newIndex);
            console.log(newIndex)
            //计算里程气泡信息用于显示
            calculateTotalMileage(newIndex)
        }
    });

    


  const chartContainer = ref(null);
  const slider = ref(null);
  const canvas = ref(null);
  const ctx = ref(null);
  const dynamicMileage=ref(0);
  
  // 设置画布尺寸和绘制图表
  const updateCanvasSizeAndRender = () => {
    if (chartContainer.value && canvas.value) {
      canvas.value.width = chartContainer.value.offsetWidth;
      canvas.value.height = chartContainer.value.offsetHeight;
      drawLineChart();
      updateSliderPosition(slider.value.offsetLeft);
      drawStopLines();
    }
  };
  
  // 绘制折线图
  const drawLineChart = () => {
    if (ctx.value) {
      ctx.value.clearRect(0, 0, ctx.value.canvas.width, ctx.value.canvas.height);
  
      // 计算比例
      const maxSpeed = props.data.reduce((max, item) => {
        const speed = Number(item.speed);
        return !isNaN(speed) ? Math.max(max, speed) : max;
        }, -Infinity);
      const xStep = ctx.value.canvas.width / (props.data.length - 1);
      const yStep = ctx.value.canvas.height / maxSpeed;
  
      // 绘制背景填充
      ctx.value.fillStyle = '#ffffff';
      ctx.value.beginPath();
      ctx.value.moveTo(0, ctx.value.canvas.height);
      ctx.value.lineTo(0, ctx.value.canvas.height - props.data[0].speed * yStep);
  
      props.data.forEach((point, index) => {
        const x = index * xStep;
        const y = ctx.value.canvas.height - point.speed * yStep;
        ctx.value.lineTo(x, y);
      });
  
      ctx.value.lineTo(ctx.value.canvas.width, ctx.value.canvas.height);
      ctx.value.closePath();
      ctx.value.fill();
  
      // 设置线条样式
      ctx.value.strokeStyle = '#ffffff';
      ctx.value.lineWidth = 1;
  
      // 绘制折线
      ctx.value.beginPath();
      ctx.value.moveTo(0, ctx.value.canvas.height - props.data[0].speed * yStep);
  
      props.data.forEach((point, index) => {
        const x = index * xStep;
        const y = ctx.value.canvas.height - point.speed * yStep;
        ctx.value.lineTo(x, y);
      });
  
      ctx.value.stroke();
    }
  };
  
  // 计算每个数据点的 x 位置
  const calculateDataPoints = () => {
    const containerWidth = chartContainer.value.offsetWidth;
    return props.data.map((_, index) => (containerWidth / (props.data.length - 1)) * index);
  };

  /**
     * 计算两个时间之间的毫秒值
     * @param {*} time1 
     * @param {*} time2 
     * @returns 
     */
    function calculateMilliseconds(time1, time2) {
    let timeformat='yyyy-MM-dd HH:mm:ss'
    // 使用全局变量 timeformat 解析时间字符串
    let date1 = moment(time1, timeformat);
    let date2 = moment(time2, timeformat);

    // 计算两个日期之间的毫秒值差异
    let milliseconds = Math.abs(date2 - date1);

    return milliseconds;
    }
  
  // 绘制停留点
  const drawStopLines = () => {
    const existingLines = document.querySelectorAll('.stop-line');
    existingLines.forEach(line => line.remove());
  
    const dataPoints = calculateDataPoints();
    const maxStopTime = Math.max(...props.data.map(d => d.stopTimeSeconds || 0));
    props.data.forEach((point, index) => {
      if (point.stopTimeSeconds) {
        let diffTime = calculateMilliseconds(point.startPosition.currentTime,point.endPosition.currentTime)/1000
        
        const x = dataPoints[index];
        const stopWidth = Math.min(10, 5 + diffTime * 2);
        const stopLine = document.createElement('div');
        stopLine.className = 'stop-line';
        stopLine.style.left = `${x - stopWidth / 2}px`;
        stopLine.style.width = `${stopWidth}px`;
        stopLine.style.height = '100%';
        stopLine.style.top = '0';
        stopLine.style.backgroundColor = 'orange';
        stopLine.style.position='absolute'
        stopLine.style.opacity=0.6
        chartContainer.value.appendChild(stopLine);
  
        stopLine.addEventListener('mouseover', () => {
          stopLine.style.cursor = 'pointer';
        });
  
      }
    });
  };
  
  // 更新滑块位置
  const updateSliderPosition = (x) => {
    const dataPoints = calculateDataPoints();
    let closestX = dataPoints[0];
    let minDist = Math.abs(x - dataPoints[0]);
  
    dataPoints.forEach(pointX => {
      const dist = Math.abs(x - pointX);
      if (dist < minDist) {
        minDist = dist;
        closestX = pointX;
      }
    });
  
    closestX = Math.max(0, Math.min(closestX, chartContainer.value.offsetWidth - slider.value.offsetWidth));
    slider.value.style.left = closestX + 'px';
  };
  
  // 滑块拖动功能
  let isDragging = false;
  
  const startDragging = (e) => {
    isDragging = true;
    e.preventDefault();
  };
  
  const drag = (e) => {
    if (isDragging) {
        let rect = chartContainer.value.getBoundingClientRect();
        let x = e.clientX - rect.left;
        x = Math.max(0, Math.min(x, chartContainer.value.offsetWidth - slider.value.offsetWidth));
        updateSliderPosition(x);

        // 当滑块被拖动时调用回调函数
        onSliderMove(props.onMove);
    }
  };
  
  const stopDragging = () => {
    isDragging = false;
  };
  
  // 点击进度条时移动滑块
  const moveSliderOnClick = (e) => {
    let rect = chartContainer.value.getBoundingClientRect();
    let x = e.clientX - rect.left;
    x = Math.max(0, Math.min(x, chartContainer.value.offsetWidth - slider.value.offsetWidth));
    updateSliderPosition(x);
  };
  
    // 拖动滑块时的回调函数
    const onSliderMove = (callback) => {
        if (typeof callback === 'function') {
            // 获取滑块对应的下标
            const dataPoints = calculateDataPoints();
            const sliderLeft = slider.value.offsetLeft;
            const closestIndex = dataPoints.reduce((closest, pointX, index) => {
            const dist = Math.abs(sliderLeft - pointX);
            return dist < Math.abs(sliderLeft - dataPoints[closest]) ? index : closest;
            }, 0);

            //计算已行进的里程
            calculateTotalMileage(closestIndex)

            // 调用回调函数并传递当前下标
            callback(closestIndex);
        }
    };

    // 根据下标控制滑块的位置
    const setSliderPositionByIndex = (index) => {
        const dataPoints = calculateDataPoints();
        if (index >= 0 && index < dataPoints.length) {
            updateSliderPosition(dataPoints[index]);
        }
    };
    
    // 方法：计算从起点到指定下标的总里程
    function calculateTotalMileage(index) {
        if(index==0){
            dynamicMileage.value=0
            return ;
        }
        let data = props.data
        if (!Array.isArray(data) || index < 0 || index >= data.length) {
            throw new Error('Invalid data or index');
        }

        // 累加从第一个点到指定下标的所有mileage
        let totalMileage = 0;
        for (let i = 0; i <= index; i++) {
            totalMileage += parseFloat( data[i].mileage) || 0; // 确保 mileage 有值
        }
        totalMileage=totalMileage.toFixed(2)
        
        // 定义单位
        const oneKilometer = 1000;
        // 如果小于1000米，显示多少米
        if (totalMileage < oneKilometer) {
            dynamicMileage.value= `${totalMileage} m`;
        }else{
            // 如果大于等于1000米，显示多少公里
            let kilometers = (totalMileage / oneKilometer).toFixed(2); // 保留两位小数
            dynamicMileage.value =`${kilometers} Km`;
        }
        
    }



    // 监听 props.data 的变化
    watch(() => props.data, (newData) => {
        if (newData.length) {
            updateCanvasSizeAndRender();
        }
    }, { immediate: true });
  
  onMounted(() => {
    canvas.value = document.getElementById('speed-chart');
    ctx.value = canvas.value.getContext('2d');
    slider.value = document.getElementById('slider');
  
    window.addEventListener('resize', updateCanvasSizeAndRender);
    slider.value.addEventListener('mousedown', startDragging);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDragging);
    chartContainer.value.addEventListener('mousedown', moveSliderOnClick);
  
    // 如果数据在挂载时已经准备好，则立即更新
    if (props.data.length) {
      updateCanvasSizeAndRender();
    }
  });
  
  onUnmounted(() => {
    window.removeEventListener('resize', updateCanvasSizeAndRender);
    slider.value.removeEventListener('mousedown', startDragging);
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDragging);
    chartContainer.value.removeEventListener('mousedown', moveSliderOnClick);
  });
  </script>
  
  <style scoped>
  .chart-container {
    width: 90%;
    height: 40px;
    background-color: rgba(105, 105, 105, 0.6);
    border: 1px solid #d7d7d7;
    border-radius: 4px;
    box-sizing: border-box;
    position: relative;
    overflow: visible;
  }
  
  canvas {
    width: 100%;
    height: 100%;
    background-color: transparent;
  }

  .slider {
        position: absolute;
        top: 1px;
        width: 8px;
        height: 34px;
        background-color: #d7d7d7;
        cursor: pointer;
        z-index: 3;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #d7d7d7;
    }
  
  .slider img {
    width: 16px;
    height: 16px;
  }



    .bubble {
        position: absolute;
        bottom: 100%; /* 位于滑块上方 */
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.75);
        color: white;
        padding: 5px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        margin-bottom: 10px; /* 与滑块的间距 */
    }

    .bubble::after {
        content: "";
        position: absolute;
        bottom: -10px; /* 调整小三角的位置 */
        left: 50%;
        transform: translateX(-50%);
        border-width: 5px;
        border-style: solid;
        border-color: #000000 transparent transparent transparent;
    }
  
  .stop-line {
    position: absolute;
    background-color: orange; /* 停留点颜色 */
    cursor: pointer; /* 鼠标指针 */
    z-index: 1; /* 确保停留点在折线图后面 */
    opacity: 0.6;
    }
  </style>
  