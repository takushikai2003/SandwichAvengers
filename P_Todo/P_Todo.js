'use strict';
import { loadCSS } from "../lib/loadCss.js";
import { createBubble } from "./js/createBubble.js";

// CSSの読み込み
loadCSS(new URL("./css/style.css", import.meta.url));

export class P_Todo extends EventTarget{
    constructor(){
        super();

        const elem = document.createElement("div");
        this.elem = elem;

        const todoForm = document.createElement("form");
        todoForm.id = "todo-form";

        const todoInput = document.createElement("input");
        todoInput.id = "todo-input";
        todoInput.type = "text";
        todoInput.placeholder = "やりたいことを書く";
        todoInput.required = true;
        todoForm.appendChild(todoInput);

        const addButton = document.createElement("button");
        addButton.textContent = "追加";
        todoForm.appendChild(addButton);

        elem.appendChild(todoForm);

        const todo_container = document.createElement("div");
        todo_container.id = "todo-container";
        todo_container.className = "bubble-container";
        elem.appendChild(todo_container);


        todoForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const input = document.getElementById('todo-input');
            const text = input.value.trim();
            if (!text) return;

            createBubble(text);
            input.value = '';
        });


        return elem;
    }
}