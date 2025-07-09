'use strict';
import { loadCSS } from "../lib/loadCss.js";

// CSSの読み込み
loadCSS(new URL("./css/style.css", import.meta.url));

/**
 * @typedef J_Todo
 * @property {Integer} count - 現在のTODOアイテムの数
 * @event J_Todo#added
 * @event J_Todo#deleted
 * @event J_Todo#stateChanged
 */
export class J_Todo extends EventTarget {
    constructor(){
        super();
        
        const elem = document.createElement("div");
        this.elem = elem;

        this.count = 0;// 現在のTODOアイテムの数


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

        const todoListEl = document.createElement("ul");
        todoListEl.className = "todo-list";
        elem.appendChild(todoListEl);


        const _this = this;

        todoForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const text = todoInput.value.trim();
            if (!text) return;

            _this.#addListItem(text, todoListEl);
            todoInput.value = '';
        });
    }


    #addListItem(text, listParent) {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.innerHTML = text;
        li.appendChild(span);
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '×';
        li.appendChild(deleteButton);


        const _this = this;
        deleteButton.onclick = function () {
            li.remove();
            console.log('Item deleted:', text);
            _this.count--;
            if (_this.count < 0) {
                _this.count = 0; // countが負にならないようにする
            }
            _this.dispatchEvent(new CustomEvent("deleted"));
            _this.dispatchEvent(new CustomEvent("stateChanged"));
        };

        listParent.appendChild(li);

        this.count++;
        this.dispatchEvent(new CustomEvent("added"));
        this.dispatchEvent(new CustomEvent("stateChanged"));
    }
}