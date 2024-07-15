let i18nJson = 
{
  "en": {
    
      "seconds": "sec",
      "minutes": "min",
      "hours": "h",
      "days_ago": "Day ago",
      "meter":"m",
      "kilometer":"km",
    
  },
  "zh": {
    
      "seconds": "秒",
      "minutes": "分钟",
      "hours": "小时",
      "days_ago": "天前",
      "meter":"米",
      "kilometer":"公里",
    
  }
}

export function getI18nValue(locale, key) {
  if (i18nJson[locale] && i18nJson[locale][key]) {
    return i18nJson[locale][key];
  }
  // 返回默认值或处理找不到对应值的情况
  return null;
}