export function utf8togbk(text){
    return new Promise((resolve, reject) => {
        fetch(`https://f075f9a88ca1.ngrok-free.app/utf8togbk?text=${text}`, {
            headers: {
                "ngrok-skip-browser-warning": "true"  // ← この1行が超重要
            }
        })
            .then(r => r.json())
            .then(data => {
                const base64 = data.gbk_base64;
                console.log(base64);


                // Base64 → バイト配列に変換
                const binary = atob(base64);  // バイナリ文字列に
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
                }

                // GBKでデコード（対応ブラウザのみ）
                const decoder = new TextDecoder("gbk", { fatal: false });
                const decodedText = decoder.decode(bytes);

                console.log("decoded: ",decodedText);

                resolve(base64);
            })
            .catch(console.error);
    });
}
