export function loadCSS(href) {
    return new Promise(resolve=>{
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.type = "text/css";
        link.href = href;
    
        // 読み込み完了時の処理
        link.onload = () => {
            // console.log(`${href} が正常に読み込まれました。`);
            resolve();
        };
    
        // 読み込み失敗時の処理
        link.onerror = () => {
            console.error(`${href} の読み込みに失敗しました。`);
        };
    
        // <head>に追加
        document.head.appendChild(link);
    });
}