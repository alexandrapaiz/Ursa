import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { join, extname } from 'node:path'
const ROOTS = { '/a': '/tmp/site-a', '/b': '/tmp/site-b' }
const TYPES = { '.html': 'text/html', '.json': 'application/json', '.css': 'text/css', '.js': 'text/javascript' }
createServer((req, res) => {
  const [prefix, ...rest] = req.url.replace(/^\//, '').split('/')
  const root = ROOTS['/' + prefix]
  if (!root) { res.writeHead(404); res.end(); return }
  let p = join(root, rest.join('/') || 'index.html')
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html')
  if (!existsSync(p)) { res.writeHead(404); res.end(); return }
  const body = readFileSync(p)
  const accepts = (req.headers['accept-encoding'] || '').includes('gzip')
  const type = TYPES[extname(p)] || 'application/octet-stream'
  if (accepts) {
    // level 6 is nginx's and GitHub Pages' ordinary setting, not 9
    const z = gzipSync(body, { level: 6 })
    res.writeHead(200, { 'content-type': type, 'content-encoding': 'gzip', 'content-length': z.length })
    res.end(z)
  } else {
    res.writeHead(200, { 'content-type': type, 'content-length': body.length })
    res.end(body)
  }
}).listen(4344, '127.0.0.1', () => console.log('sites on 4344'))
