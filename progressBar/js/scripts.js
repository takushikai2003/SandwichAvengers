const mbtiType = "INFJ";


function getMBTISettings(mbti) {
  const [ei, sn, tf, jp] = mbti.toUpperCase().split('');
  return { sn, jp };
}

const { sn, jp } = getMBTISettings(mbtiType);

function updateProgress() {
  const tasks = document.querySelectorAll('.task input[type=\"checkbox\"]');
  const completed = Array.from(tasks).filter(t => t.checked).length;
  const total = tasks.length;

  const percent = total ? Math.floor((completed / total) * 100) : 0;
  const progressText = document.getElementById('progress-percent');
  progressText.textContent = `進捗：${percent}%`;

  const progressArea = document.getElementById('progress-area');
  progressArea.innerHTML = '';

  // カレンダー表示
  const days = sn === 'S' ? 100 : 7;
  for (let i = 0; i < days; i++) {
    const day = document.createElement('div');
    day.className = 'calendar-day';
    if (i === 0 && percent === 100) {
      day.classList.add('done');
    }
    progressArea.appendChild(day);
  }
}


export class progressBar{
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
			if (i === 0 && percent === 100) {
			day.classList.add('done');
			}
			progressArea.appendChild(day);
		}
	}
}