<template>
    <div class="chart-container" ref="chartContainer">
      <canvas id="speed-chart"></canvas>
      <div
        v-if="dynamicMileage!=0"
        class="bubble"
        :class="{ 'is-moving': isDragging }"
        :style="{ left: `${bubbleLeft}px` }"
      >
        <div class="bubble-item"><span class="bubble-label">{{locale=='zh'?'里程:':'Mileage:'}}</span> {{dynamicMileage}} km</div>
        <div class="bubble-item"><span class="bubble-label">{{locale=='zh'?'速度:':'Speed:'}}</span> {{currentPoint.speed !== undefined ? currentPoint.speed.toFixed(2) : '--'}} km/h</div>
        <div class="bubble-item"><span class="bubble-label">{{locale=='zh'?'时间:':'Time:'}}</span> {{currentPoint.currentTime || '--'}}</div>
      </div>
      <div id="slider" class="slider">
        <img :src="sliderImage" alt="Slider Handle" />
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, watch, onMounted, onUnmounted } from 'vue';
  
  // 接收数据
  const props = defineProps({
        locale: {
          type: String,
          required: false,
          default: 'zh'
        },
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
            //计算里程气泡信息用于显示
            calculateTotalMileage(newIndex)
        }
    });

    


  const chartContainer = ref(null);
  const slider = ref(null);
  const canvas = ref(null);
  const ctx = ref(null);
  const dynamicMileage=ref(0);
  const currentPoint=ref({});
  const bubbleLeft = ref(0);
  
  // 设置画布尺寸和绘制图表
  const updateCanvasSizeAndRender = () => {
    if (!chartContainer.value || !canvas.value || !slider.value || !ctx.value) {
      return;
    }
    if (!props.data.length) {
      return;
    }
    // 提升清晰度：按 devicePixelRatio 缩放画布像素密度
    const cssWidth = chartContainer.value.offsetWidth;
    const cssHeight = chartContainer.value.offsetHeight;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.value.style.width = `${cssWidth}px`;
    canvas.value.style.height = `${cssHeight}px`;
    canvas.value.width = Math.round(cssWidth * dpr);
    canvas.value.height = Math.round(cssHeight * dpr);
    // 将绘制坐标系保持在 CSS 像素单位，避免后续计算被 dpr 影响
    ctx.value.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawLineChart();
    updateSliderPosition(slider.value.offsetLeft);
    drawStopLines();
  };
  
  // 绘制折线图
  const drawLineChart = () => {
    if (ctx.value && props.data.length >= 2) {
      const width = chartContainer.value?.offsetWidth ?? 0;
      const height = chartContainer.value?.offsetHeight ?? 0;
      ctx.value.clearRect(0, 0, width, height);
  
      // 计算比例
      const maxSpeed = props.data.reduce((max, item) => {
        const speed = Number(item.speed);
        return !isNaN(speed) ? Math.max(max, speed) : max;
        }, -Infinity);
      const xStep = width / (props.data.length - 1);
      const yStep = height / maxSpeed;
  
      // 绘制背景填充
      ctx.value.fillStyle = '#ffffff';
      // 设置背景透明度为30%
      ctx.value.globalAlpha = 0.3;
      ctx.value.beginPath();
      ctx.value.moveTo(0, height);
      ctx.value.lineTo(0, height - props.data[0].speed * yStep);
  
      props.data.forEach((point, index) => {
        const x = index * xStep;
        const y = height - point.speed * yStep;
        ctx.value.lineTo(x, y);
      });
  
      ctx.value.lineTo(width, height);
      ctx.value.closePath();
      ctx.value.fill();
      // 避免透明度影响线条显示
      ctx.value.globalAlpha = 1;
  
      // 设置线条样式
      ctx.value.strokeStyle = '#ffffff';
      ctx.value.lineWidth = 2;

      // 绘制折线
      ctx.value.beginPath();
      ctx.value.moveTo(0, height - props.data[0].speed * yStep);

  
      props.data.forEach((point, index) => {
        const x = index * xStep;
        const y = height - point.speed * yStep;
        ctx.value.lineTo(x, y);
      });
  
      ctx.value.stroke();
    }
  };
  
  // 计算每个数据点的 x 位置
  const calculateDataPoints = () => {
    if (!chartContainer.value || props.data.length < 2) {
      return [];
    }
    const containerWidth = chartContainer.value.offsetWidth;
    const sliderWidth = slider.value?.offsetWidth ?? 0;
    // 以手柄可移动的最大范围为基准，保证最后一个点可达
    const trackWidth = Math.max(0, containerWidth - sliderWidth);
    return props.data.map((_, index) => (trackWidth / (props.data.length - 1)) * index);
  };
  
  // 绘制停留点
  const drawStopLines = () => {
    if (!chartContainer.value || props.data.length < 2) {
      return;
    }
    const existingLines = document.querySelectorAll('.stop-line');
    existingLines.forEach(line => line.remove());
  
    const dataPoints = calculateDataPoints();
    props.data.forEach((point, index) => {
      if (point.stopTimeSeconds) {
        const x = dataPoints[index];
        const stopWidth = 2;
        const stopLine = document.createElement('div');
        stopLine.className = 'stop-line';
        const containerWidth = chartContainer.value.offsetWidth;
        const left = Math.max(0, Math.min(x - stopWidth / 2, containerWidth - stopWidth));
        stopLine.style.left = `${left}px`;
        stopLine.style.width = `${stopWidth}px`;
        stopLine.style.height = '100%';
        stopLine.style.top = '0';
        stopLine.style.backgroundColor = 'orange';
        stopLine.style.position='absolute';
        stopLine.style.opacity=0.6;
        chartContainer.value.appendChild(stopLine);
  
        stopLine.addEventListener('mouseover', () => {
          stopLine.style.cursor = 'pointer';
        });
  
      }
    });
  };
  
  // 更新滑块位置
  const updateSliderPosition = (x) => {
    if (!chartContainer.value || !slider.value) {
      return;
    }
    const dataPoints = calculateDataPoints();
    if (!dataPoints.length) {
      return;
    }
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
    bubbleLeft.value = closestX + slider.value.offsetWidth / 2;
  };
  
  // 滑块拖动功能
  const isDragging = ref(false);
  
  const startDragging = (e) => {
    isDragging.value = true;
    e.preventDefault();
  };
  
  const drag = (e) => {
    if (isDragging.value && chartContainer.value && slider.value) {
        let rect = chartContainer.value.getBoundingClientRect();
        let x = e.clientX - rect.left;
        x = Math.max(0, Math.min(x, chartContainer.value.offsetWidth - slider.value.offsetWidth));
        updateSliderPosition(x);

        // 当滑块被拖动时调用回调函数
        onSliderMove(props.onMove);
    }
  };
  
    const stopDragging = () => {
      isDragging.value = false;
    };
    
    // 点击进度条时移动滑块
    const moveSliderOnClick = (e) => {
      if (!chartContainer.value || !slider.value) {
        return;
      }
      let rect = chartContainer.value.getBoundingClientRect();
      let x = e.clientX - rect.left;
      x = Math.max(0, Math.min(x, chartContainer.value.offsetWidth - slider.value.offsetWidth));
      updateSliderPosition(x);

      // 滑块儿位置更新后，调用move事件，同步渲染里程气泡并且回传数据给到回调函数
      onSliderMove(props.onMove);
      
    };
  
    // 拖动滑块时的回调函数
    const onSliderMove = (callback) => {
        if (typeof callback === 'function' && slider.value) {
            // 获取滑块对应的下标
            const dataPoints = calculateDataPoints();
            if (!dataPoints.length) {
              return;
            }
            const sliderLeft = slider.value.offsetLeft;
            const closestIndex = dataPoints.reduce((closest, pointX, index) => {
              const dist = Math.abs(sliderLeft - pointX);
              return dist < Math.abs(sliderLeft - dataPoints[closest]) ? index : closest;
            }, 0);

            //计算已行进的里程
            calculateTotalMileage(closestIndex)

            //缓存当前点的信息
            currentPoint.value=props.data[closestIndex]

            // 调用回调函数并传递当前下标
            callback(closestIndex);
        }
    };

    // 根据下标控制滑块的位置
    const setSliderPositionByIndex = (index) => {
        const dataPoints = calculateDataPoints();
        if (index >= 0 && index < dataPoints.length) {
            updateSliderPosition(dataPoints[index]);

            //缓存当前点的信息
            currentPoint.value=props.data[index]
        }
    };
    
    // 方法：计算从起点到指定下标的总里程
    function calculateTotalMileage(index) {
        if(index==0){
            dynamicMileage.value=0
            currentPoint.value=props.data[0] || {}
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
        if (newData.length && chartContainer.value && canvas.value && slider.value && ctx.value) {
            updateCanvasSizeAndRender();
        }
    }, { immediate: true });
  
  onMounted(() => {
    if (!chartContainer.value) {
      return;
    }
    canvas.value = chartContainer.value.querySelector('#speed-chart');
    slider.value = chartContainer.value.querySelector('#slider');
    if (!canvas.value || !slider.value) {
      return;
    }
    ctx.value = canvas.value.getContext('2d');

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
    if (slider.value) {
      slider.value.removeEventListener('mousedown', startDragging);
    }
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDragging);
    if (chartContainer.value) {
      chartContainer.value.removeEventListener('mousedown', moveSliderOnClick);
    }
  });
  </script>
  
  <style scoped>
  .chart-container {
    width: 90%;
    height: 40px;
    background: linear-gradient(180deg, rgba(22, 24, 28, 0.55), rgba(22, 24, 28, 0.35));
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 10px;
    box-sizing: border-box;
    position: relative;
    overflow: visible;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.22);
    backdrop-filter: blur(10px);
  }
  
  canvas {
    width: 100%;
    height: 100%;
    background-color: transparent;
    display: block;
  }

  .slider {
        position: absolute;
        top: 3px;
        width: 10px;
        height: 32px;
        background: rgba(255, 255, 255, 0.14);
        cursor: pointer;
        z-index: 3;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(255, 255, 255, 0.22);
        border-radius: 999px;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.25);
        transition: background-color 120ms ease, box-shadow 120ms ease, transform 120ms ease;
    }
  .slider:active {
    background: rgba(255, 255, 255, 0.2);
    box-shadow: 0 10px 22px rgba(0, 0, 0, 0.3);
    transform: scale(1.02);
  }
  
  .slider img {
    width: 14px;
    height: 14px;
    opacity: 0.95;
    filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.35));
  }



    .bubble {
        position: absolute;
        bottom: 100%; /* 位于滑块上方 */
        left: 0;
        transform: translateX(-50%);
        background: rgba(15, 16, 18, 0.9);
        color: white;
        padding: 10px 12px;
        border-radius: 10px;
        font-size: 12px;
        white-space: nowrap;
        margin-bottom: 10px; /* 与滑块的间距 */
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 10px 26px rgba(0, 0, 0, 0.35);
        min-width: 150px;
        transition: left 180ms cubic-bezier(0.22, 0.61, 0.36, 1);
        will-change: left;
    }
    .bubble.is-moving {
        transition: left 180ms cubic-bezier(0.22, 0.61, 0.36, 1);
    }

    .bubble::after {
        content: "";
        position: absolute;
        bottom: -8px; /* 调整小三角的位置 */
        left: 50%;
        transform: translateX(-50%);
        border-width: 4px;
        border-style: solid;
        border-color: rgba(15, 16, 18, 0.9) transparent transparent transparent;
    }
    
    .bubble-item {
        margin-bottom: 4px;
        display: flex;
        justify-content: space-between;
        gap: 10px;
    }
    
    .bubble-item:last-child {
        margin-bottom: 0;
    }
    
    .bubble-label {
        color: rgba(255, 255, 255, 0.65);
        margin-right: 5px;
        font-weight: 500;
    }
  
  .stop-line {
    position: absolute;
    background-color: orange; /* 停留点颜色 */
    cursor: pointer; /* 鼠标指针 */
    z-index: 1; /* 确保停留点在折线图后面 */
    opacity: 0.55;
    border-radius: 999px;
    }
  </style>
  