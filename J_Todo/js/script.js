document.getElementById('todo-form').addEventListener('submit', function (e) {
  e.preventDefault();

  const input = document.getElementById('todo-input');
  const text = input.value.trim();
  if (!text) return;

  addListItem(text);
  input.value = '';
});

function addListItem(text) {
  const list = document.getElementById('todo-list');

  const li = document.createElement('li');
  li.innerHTML = `${text} <button onclick="this.parentElement.remove()">×</button>`;

  list.appendChild(li);
}
