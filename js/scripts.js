function getMBTISettings(mbti) {
  const [ei, sn, tf, jp] = mbti.toUpperCase().split('');
  document.body.classList.add(tf); // T or F
  document.body.classList.add(jp); // J or P
  return { sn, jp };
}

const { sn, jp } = getMBTISettings(mbtiType);

function addTask() {
  const input = document.getElementById('task-input');
  const taskList = document.getElementById('task-list');
  const value = input.value.trim();
  if (!value) return;

  const task = document.createElement('div');
  task.className = 'task';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.onchange = updateProgress;

  const label = document.createElement('label');
  label.textContent = value;

  task.appendChild(checkbox);
  task.appendChild(label);
  taskList.appendChild(task);

  input.value = '';
  updateProgress();
}

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
  const days = sn === 'S' ? 90 : 7;
  for (let i = 0; i < days; i++) {
    const day = document.createElement('div');
    day.className = 'calendar-day';
    if (i === 0 && percent === 100) {
      day.classList.add('done');
    }
    progressArea.appendChild(day);
  }
}
