// usage: node cap.js <page> <state> <captureId> <promptId>
const {spawn}=require('child_process');
const [page,s,id,pid]=process.argv.slice(2);
const ep=encodeURIComponent(`https://mcp.figma.com/mcp/capture/${id}/submit?bindVariables=true&promptId=${pid}`);
const url=`http://127.0.0.1:8765/${page}.html?s=${s}#figmacapture=${id}&figmaendpoint=${ep}&figmadelay=2500`;
const C='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const p=spawn(C,['--headless=new','--disable-gpu','--hide-scrollbars','--window-size=1440,900',`--user-data-dir=${__dirname}/chprof-${s}`,'--remote-debugging-port=0',url],{stdio:'ignore'});
setTimeout(()=>{p.kill('SIGTERM');process.exit(0)},25000);
