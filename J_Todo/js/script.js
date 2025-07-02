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
  const span = document.createElement('span');
  span.innerHTML = text;
  li.appendChild(span);
  const deleteButton = document.createElement('button');
  deleteButton.textContent = '×';
  li.appendChild(deleteButton);


  deleteButton.onclick = function () {
    li.remove();
    console.log('Item deleted:', text);
  };

  list.appendChild(li);
}
