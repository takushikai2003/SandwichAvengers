import { P_Todo } from "../P_Todo/P_Todo.js";
import { J_Todo } from "../J_Todo/J_Todo.js";
import { ProgressBar } from "../progressBar/ProgressBar.js";

const mbti = "isfp";

// 右側に表示するもの
let todo_content;
// P
if(mbti.includes("p")){
    todo_content = new P_Todo();
}
// J
else{
    todo_content = new J_Todo();
}

// 左側に表示するもの
let progress_bar;
// S
if(mbti.includes("s")){
    progress_bar = new ProgressBar(new Date(), 100);
}
// N
else{
    progress_bar = new ProgressBar(new Date(), 7);
}

// 表示
const left_area = document.getElementById("left_area");
const right_area = document.getElementById("right_area");

left_area.appendChild(progress_bar.elem);
right_area.appendChild(todo_content.elem);


// 最初に完了状態にする（最初はタスクが設定されていないため）
progress_bar.completeDate(new Date());


// Todoの状態が変わるごとに、完了しているかの表示を更新
todo_content.addEventListener("stateChanged", (e) => {
    if(todo_content.count == 0){
        progress_bar.completeDate(new Date());
    }
    else{
        progress_bar.incompleteDate(new Date());
    }
});