// 旧站（aryella-byte.github.io/juripulse/，以及经它转发的 juripulse.vercel.app）已迁到 juripulse.cn（2026-10-20）。
// 本脚本生成只含跳转页的静态站，供 GitHub Pages 发布：每个旧页面跳到新站对应页面，其他路径由 404.html 按规则跳转。
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

const OUT = path.resolve('redirect-site')
const NEW = 'https://juripulse.cn'
const routes = {
  '': `${NEW}/`,
  research: `${NEW}/journal/research`,
  pulse: `${NEW}/journal/pulse`,
  brief: `${NEW}/journal/brief`,
  theory: `${NEW}/seeing-theory/`,
}
for (let n = 1; n <= 7; n += 1) routes[`theory/chapter${n}`] = `${NEW}/seeing-theory/chapter/${n}`

const page = (url) => `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>法脉 JuriPulse 已迁至 juripulse.cn</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="${url}">
<meta http-equiv="refresh" content="0; url=${url}">
<script>location.replace(${JSON.stringify(url)} + location.hash)</script>
</head>
<body>
<p>本站已迁至 <a href="${url}">${url}</a>。</p>
</body>
</html>
`

// 404.html：处理不在上面清单里的旧路径（含末尾斜杠、.html 后缀、查询参数）
const fallback = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>法脉 JuriPulse 已迁至 juripulse.cn</title>
<meta name="robots" content="noindex">
<script>
  (function () {
    var p = location.pathname.replace(/^\\/juripulse/, '').replace(/\\.html$/, '').replace(/\\/+$/, '');
    var m = p.match(/^\\/theory\\/chapter([1-7])$/);
    var map = { '': '/', '/research': '/journal/research', '/pulse': '/journal/pulse', '/brief': '/journal/brief', '/theory': '/seeing-theory/' };
    var target = m ? '/seeing-theory/chapter/' + m[1] : (map[p] || '/journal/');
    location.replace('${NEW}' + target + location.hash);
  })();
</script>
</head>
<body>
<p>本站已迁至 <a href="${NEW}/">juripulse.cn</a>。</p>
</body>
</html>
`

await rm(OUT, { recursive: true, force: true })
for (const [route, url] of Object.entries(routes)) {
  const dir = path.join(OUT, route)
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, 'index.html'), page(url))
  if (route) await writeFile(path.join(OUT, `${route}.html`), page(url))   // 旧站由 Next 静态导出，页面文件形如 brief.html
}
await writeFile(path.join(OUT, '404.html'), fallback)
await writeFile(path.join(OUT, '.nojekyll'), '')
console.log(`redirect site: ${Object.keys(routes).length} routes -> ${OUT}`)
