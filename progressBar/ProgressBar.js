'use strict';
import { loadCSS } from "../lib/loadCss.js";

// CSSの読み込み
loadCSS(new URL("./css/style.css", import.meta.url));

export class ProgressBar{
	/**
	 * 
	 * @param {Integer} days 表示する文字数（Sタイプなら7日、Nタイプなら100日）
	 */
	constructor(days){
		this.totalDays = days;

		const elem = document.createElement("div");
		elem.setAttribute("style","width:100%; height:100%;");
		this.elem = elem;
		
		const progressArea = document.createElement("div");
		progressArea.id = "progress-area";
		progressArea.innerHTML = ''; // 既存の内容をクリア
		for (let i = 0; i < days; i++) {
			const day = document.createElement('div');
			day.className = 'calendar-day';
			progressArea.appendChild(day);
		}
		elem.appendChild(progressArea);


		// const percent = total ? Math.floor((completed / total) * 100) : 0;
		const progressText = document.createElement("div");
		progressText.id = "progress-percent";
		progressText.textContent = `進捗：${0}%`;
		elem.appendChild(progressText);
	}

	completeToday(){
		// TODO:
		// 完了したら？
		// 失敗したら？
		const progressArea = document.getElementById('progress-area');
		const days = progressArea.children;

		let percent = 0;
		for (let i = 0; i < this.totalDays; i++) {
			if (!days[i].classList.contains('done')) {
				days[i].classList.add('done');

				percent = Math.floor(((i+1) / this.totalDays) * 100);
				break;
			}
		}

		const progressText = document.getElementById('progress-percent');
		progressText.textContent = `進捗：${percent}%`;
	}
}