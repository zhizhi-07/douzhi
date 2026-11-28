export const HTML_SANDBOX = 'allow-scripts'
export function safeHtmlDocument(html: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: https:; font-src data:; media-src data: blob:; connect-src 'none'; form-action 'none'; base-uri 'none'"><meta name="referrer" content="no-referrer"><style>html,body{margin:0;overflow-wrap:anywhere;font:14px system-ui}*{box-sizing:border-box}img{max-width:100%}</style></head><body>${html}<script>new ResizeObserver(()=>parent.postMessage({type:'douzhi-html-height',height:document.documentElement.scrollHeight},'*')).observe(document.body)</script></body></html>`
}
