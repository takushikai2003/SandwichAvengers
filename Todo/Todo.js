'use strict';
import { loadCSS } from "../lib/loadCss.js";
import { getUserProfile, updateUserProfile, isLogin, logout } from "../lib/firebaseCommon.js";

// ログインしていなければログイン画面に戻す
if(!(await isLogin())) {
    console.log("User not logged in, redirecting to login page.");
    window.location.href = "../index.html";
}

loadCSS(new URL("./style.css", import.meta.url));

/**
 * @typedef TodoItem
 * @param {string} text - ToDoの内容
 * @property {string} id - もしidがあれば、そのIDをDBから探して取得する
 */
class TodoItem extends EventTarget {
    constructor(text, id) {
        super();

        if(id){
            return new Promise(async (resolve, reject) => {
                getUserProfile().then(profile => {
                    this.id = id;
                    this.text = text;
                    this.completed = profile.todoItems.find(item => item.id === this.id).completed;
                    resolve(this);
                }).catch(error => {
                    console.error("Error fetching user profile:", error);
                    reject(error);
                });
            });
        }

        else{
            this.id = Date.now() + Math.random().toString(36).slice(2, 8)
            this.text = text;
            this.completed = false;

            return new Promise(async (resolve, reject) => {
                getUserProfile().then(profile => {
                    profile.todoItems.push({
                        id: this.id,
                        text: this.text,
                        completed: this.completed
                    });
                    updateUserProfile(profile)
                        .then(() => {
                            resolve(this);
                        })
                        .catch(error => reject(error));

                }).catch(error => {
                    console.error("Error fetching user profile:", error);
                    reject(error);
                });
            });
        }
        
    }


    setCompleted() {
        return new Promise(async (resolve, reject) => {
            getUserProfile().then(profile => {
                // 対象のアイテムを見つけて完了状態にする
                profile.todoItems.find(item => item.id === this.id).completed = true;

                updateUserProfile(profile)
                    .then(() => {
                        resolve();
                    })
                    .catch(error => reject(error));

            }).catch(error => {
                console.error("Error fetching user profile:", error);
                reject(error);
            });
        });
        
    }
}


export class Todo extends EventTarget{
    
    /**
     * @typedef Todo
     * @param {string} MbtiType - INFJとか。P or Jで画面の種類、TとFでシンプル/カラフルを切り替える
     * @property {Integer} count - 現在のTODOアイテムの数
     * @event Todo#added
     * @event Todo#itemCompleted
     * @event Todo#stateChanged
     */
    constructor(MbtiType){
        super();

        const elem = document.createElement("div");
        this.elem = elem;

        this.count = 0;// 現在completeされていないTODOアイテムの数


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
        addButton.id = "add-button";
        todoForm.appendChild(addButton);

        elem.appendChild(todoForm);


        if(MbtiType.includes('P')) {
            const todoContainer = document.createElement("div");
            todoContainer.id = "todo-container";
            todoContainer.className = "bubble-container";
            elem.appendChild(todoContainer);

            const _this = this;

            todoForm.addEventListener('submit', async function(e) {
                e.preventDefault();

                const input = document.getElementById('todo-input');
                const text = input.value.trim();
                if (!text) return;

                const item = await (new TodoItem(text));

                _this.#addBubbleItem(item);
                input.value = '';
            });
        }
        else if(MbtiType.includes('J')) {
            const todoContainer = document.createElement("div");
            todoContainer.id = "todo-container";
            todoContainer.className = "list-container";
            elem.appendChild(todoContainer);
            const todoListEl = document.createElement("ul");
            todoListEl.className = "todo-list";
            todoContainer.appendChild(todoListEl);

            const _this = this;

            todoForm.addEventListener('submit', async function (e) {
                e.preventDefault();

                const text = todoInput.value.trim();
                if (!text) return;

                const item = await (new TodoItem(text));

                _this.#addListItem(item, todoListEl);
                todoInput.value = '';
            });
        }
        
        else {
            throw new Error("Invalid MbtiType. Use 'P' or 'J'.");
        }


        // DB上のデータを取得して表示する
        getUserProfile().then(profile => {
            profile.todoItems.forEach(async itemData => {
                if(itemData.completed) return; // 完了済みのアイテムは表示しない

                const item = await (new TodoItem(itemData.text, itemData.id));
                if (MbtiType === 'P') {
                    this.#addBubbleItem(item);
                } else if (MbtiType === 'J') {
                    const todoListEl = document.querySelector(".todo-list");
                    if (todoListEl) {
                        this.#addListItem(item, todoListEl);
                    }
                }
            });
        }).catch(error => {
            console.error("Error fetching user profile:", error);
        });
    }



    /** * @private
     * @param {TodoItem} item
     */
    #addBubbleItem(item) {
        const container = document.getElementById('todo-container');

        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        // bubble.innerHTML = `${text} <button onclick="this.parentElement.remove()">×</button>`;
        const span = document.createElement('span');
        span.textContent = item.text;
        bubble.appendChild(span);
        const completeButton = document.createElement('button');
        completeButton.textContent = '×';
        bubble.appendChild(completeButton); 

        const _this = this;
        completeButton.onclick = async function() {
            await item.setCompleted();
            
            bubble.remove();
            console.log('Bubble completed:', item.text);
            _this.count--;
            if (_this.count < 0) {
                _this.count = 0; // countが負にならないようにする
            }
            _this.dispatchEvent(new CustomEvent("itemCompleted"));
            _this.dispatchEvent(new CustomEvent("stateChanged"));
        };

        
        const bubbleWidth = 120;
        const bubbleHeight = 120;

        const maxX = container.clientWidth  - bubbleWidth;
        const maxY = container.clientHeight - bubbleHeight;

        let placed = false;
        let attempt = 0;
        const maxAttempts = 100;

        while (!placed && attempt < maxAttempts) {
            const left = Math.random() * maxX;
            const top  = Math.random() * maxY;

            const existingBubbles = container.getElementsByClassName('bubble');
            let overlap = false;

            for (let i = 0; i < existingBubbles.length; i++) {
                const other = existingBubbles[i];
                const otherLeft = parseFloat(other.style.left);
                const otherTop  = parseFloat(other.style.top);

                const dx = left - otherLeft;
                const dy = top  - otherTop;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < bubbleWidth * 0.9) {
                    overlap = true;
                    break;
                }
            }

            if (!overlap) {
                bubble.style.left = `${left}px`;
                bubble.style.top  = `${top}px`;
                placed = true;
            }
            attempt++;
        }

        container.appendChild(bubble); // ← 最後に追加

        this.count++;
        this.dispatchEvent(new CustomEvent("added"));
        this.dispatchEvent(new CustomEvent("stateChanged"));
    }



    #addListItem(item, listParent) {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.innerHTML = item.text;
        li.appendChild(span);
        const completeButton = document.createElement('button');
        completeButton.textContent = '×';
        li.appendChild(completeButton);


        const _this = this;
        completeButton.onclick = async function () {
            await item.setCompleted();

            li.remove();
            console.log('Item completed:', item.text);
            _this.count--;
            if (_this.count < 0) {
                _this.count = 0; // countが負にならないようにする
            }
            _this.dispatchEvent(new CustomEvent("itemCompleted"));
            _this.dispatchEvent(new CustomEvent("stateChanged"));
        };

        listParent.appendChild(li);

        this.count++;
        this.dispatchEvent(new CustomEvent("added"));
        this.dispatchEvent(new CustomEvent("stateChanged"));
    }
}