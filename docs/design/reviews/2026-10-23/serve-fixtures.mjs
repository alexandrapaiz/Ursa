import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
const DIR = new URL('./fixtures', import.meta.url).pathname
const MAP = {
  '/single/index.json': 'index-single.json',
  '/stated-none/index.json': 'index-stated-none.json',
  '/empty/index.json': 'index-empty.json',
  '/unbounded/index.json': 'index-unbounded.json',
}
createServer((req, res) => {
  const file = MAP[req.url]
  if (!file) { res.writeHead(404, { 'access-control-allow-origin': '*' }); res.end('no'); return }
  const body = readFileSync(`${DIR}/${file}`)
  res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
  res.end(body)
}).listen(4333, '127.0.0.1', () => console.log('fixtures on 4333'))
