export class ProgressBar{
	/**
	 * 
	 * @param {Integer} days 表示する文字数（Sタイプなら7日、Nタイプなら100日）
	 */
	constructor(days){
		const progressArea = document.getElementById('progress-area');
		progressArea.innerHTML = ''; // 既存の内容をクリア
		for (let i = 0; i < days; i++) {
			const day = document.createElement('div');
			day.className = 'calendar-day';
			// if (i === 0 && percent === 100) {
			// 	day.classList.add('done');
			// }
			progressArea.appendChild(day);
		}

		// const percent = total ? Math.floor((completed / total) * 100) : 0;
		const progressText = document.getElementById('progress-percent');
		progressText.textContent = `進捗：${0}%`;
	}

	completeToday(){
		// TODO:
		// 完了したら？
		// 失敗したら？
		const progressArea = document.getElementById('progress-area');
		const days = progressArea.children;
		for (let i = 0; i < days.length; i++) {
			if (!days[i].classList.contains('done')) {
				days[i].classList.add('done');
				return;
			}
		}
	}
}