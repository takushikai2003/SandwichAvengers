'use strict';
import { loadCSS } from "../lib/loadCss.js";

// CSSの読み込み
loadCSS(new URL("./css/style.css", import.meta.url));

export class J_Todo extends EventTarget {
    constructor(){
        super();
        
        const elem = document.createElement("div");
        this.elem = elem;

        const todoForm = document.createElement("form");
        todoForm.id = "todo-form";

        const todoInput = document.createElement("input");
        todoInput.id = "todo-input";
        todoInput.type = "text";
        todoInput.placeholder = "やるべきことを書く";
        todoInput.required = true;
        todoForm.appendChild(todoInput);

        const addButton = document.createElement("button");
        addButton.textContent = "追加";
        todoForm.appendChild(addButton);

        elem.appendChild(todoForm);

        todoForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const text = todoInput.value.trim();
            if (!text) return;

            addListItem(text);
            todoInput.value = '';
        });

        const todoListEl = document.createElement("ul");
        todoListEl.className = "todo-list";
        elem.appendChild(todoListEl);


        function addListItem(text) {
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

            todoListEl.appendChild(li);
        }

        return elem;
    }
}