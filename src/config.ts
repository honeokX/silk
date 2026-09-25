export const SITE = {
  url: 'https://silk.honeok.com', // 网站地址
  lang: 'zh-CN', // 页面语言
  title: '随机丝袜图片', // 网站名称
  description: '随机浏览丝袜图片', // 网站描述
  logo: '/logo.svg', // 网站 Logo
} as const

export const IMAGE_APIS = [
  'https://itapi.top/api/hs',
  'https://api.yujn.cn/api/heisi.php',
  'https://api.suyanw.cn/api/hs.php',
  'https://v2.xxapi.cn/api/baisi?return=302',
  'https://v2.xxapi.cn/api/heisi?return=302',
] as const

export const IMAGE_JSON_APIS = ['https://api.52hyjs.com/api/baisi', 'https://api.52hyjs.com/api/heisi'] as const

// 网站统计 设置为 null 时不加载
export const ANALYTICS: { src: string; websiteId: string } | null = {
  src: 'https://u.honeok.com/script.js',
  websiteId: '825b987b-6add-4b6a-b55d-c1cf19cd2690',
}
