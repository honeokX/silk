export const site = {
  url: 'https://silk.honeok.com', // 网站地址
  lang: 'zh-CN', // 页面语言
  title: '随机看丝', // 网站名称
  description: '随机看丝', // 网站描述
  logo: '/logo.svg', // 网站 Logo
} as const

export const imageApis = [
  'https://itapi.top/api/hs',
  'https://api.suyanw.cn/api/hs.php',
  'http://api.yujn.cn/api/baisi.php',
  'http://api.yujn.cn/api/heisi.php',
  'https://api.yviii.com/img/baisi',
  'https://api.yviii.com/img/heisi',
] as const

export const imageJsonApis = [
  'https://api.52hyjs.com/api/baisi',
  'https://api.52hyjs.com/api/heisi',
  'https://openapi.dwo.cc/api/bs_img',
  'https://openapi.dwo.cc/api/hs_img',
  'https://openapi.dwo.cc/api/bs_jk',
  'https://openapi.dwo.cc/api/hs_jk',
] as const

// 网站统计 设置为 null 时不加载
export const analytics: { src: string; websiteId: string } | null = {
  src: 'https://u.honeok.com/script.js',
  websiteId: '825b987b-6add-4b6a-b55d-c1cf19cd2690',
}
