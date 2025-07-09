'use strict';
import { loadCSS } from "../lib/loadCss.js";

// CSSの読み込み
loadCSS(new URL("./css/style.css", import.meta.url));

export class ProgressBar{
	/**
	 * @param {Date} startDate 開始日
	 * @param {Integer} totalDays 表示する文字数（Sタイプなら7日、Nタイプなら100日）
	 * @property {Integer} totalDays - 総日数（開始日含む）
	 * @property {Date} startDate - 開始日
	 */
	constructor(startDate, totalDays){
		this.startDate = startDate;
		this.totalDays = totalDays;
		this.datesState = new Array(totalDays).fill(false); // 各日の状態を管理する配列(false: 未完了, true: 完了)

		const elem = document.createElement("div");
		elem.setAttribute("style","width:100%; height:100%;");
		this.elem = elem;
		
		const progressArea = document.createElement("div");
		progressArea.id = "progress-area";
		progressArea.innerHTML = ''; // 既存の内容をクリア
		for (let i = 0; i < totalDays; i++) {
			const day = document.createElement('div');
			day.className = 'calendar-day';

			if(this.datesState[i]){
				day.classList.add('done');
			}
			
			progressArea.appendChild(day);
		}
		elem.appendChild(progressArea);


		// const percent = total ? Math.floor((completed / total) * 100) : 0;
		const progressText = document.createElement("div");
		progressText.id = "progress-percent";
		progressText.textContent = `進捗：${0}%`;
		elem.appendChild(progressText);
	}

	completeDate(date){
		const progressArea = document.getElementById('progress-area');
		const days = progressArea.children;

		// dateとstartDateの差を計算（日）
		const direction = date.getTime() - this.startDate.getTime();
		const dayIndex = Math.floor(direction / (1000 * 60 * 60 * 24)); // ミリ秒を日数に変換
		if (dayIndex < 0 || dayIndex >= this.totalDays) {
			console.error("指定された日付は範囲外です。");
			return;
		}
		// 完了状態を更新
		this.datesState[dayIndex] = true;
		days[dayIndex].classList.add('done'); // 完了状態のクラスを追加


		const count = this.datesState.filter(state => state).length; // 完了した日の数
		const percent = Math.floor((count / this.totalDays) * 100);
		
		const progressText = document.getElementById('progress-percent');
		progressText.textContent = `進捗：${percent}%`;
	}

	// doneになってるのを解除する
	incompleteDate(date){
		const progressArea = document.getElementById('progress-area');
		const days = progressArea.children;

		// dateとstartDateの差を計算（日）
		const direction = date.getTime() - this.startDate.getTime();
		const dayIndex = Math.floor(direction / (1000 * 60 * 60 * 24)); // ミリ秒を日数に変換
		if (dayIndex < 0 || dayIndex >= this.totalDays) {
			console.error("指定された日付は範囲外です。");
			return;
		}
		// 完了状態を更新
		this.datesState[dayIndex] = false;
		days[dayIndex].classList.remove('done'); // 完了状態のクラスを削除
		
		// 完了した日の数をカウント
		const count = this.datesState.filter(state => state).length; // 完了した日の数
		const percent = Math.floor((count / this.totalDays) * 100);

		const progressText = document.getElementById('progress-percent');
		progressText.textContent = `進捗：${percent}%`;
	}
}