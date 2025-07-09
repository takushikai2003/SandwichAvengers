import { P_Todo } from "../P_Todo/P_Todo.js";
import { J_Todo } from "../J_Todo/J_Todo.js";
import { ProgressBar } from "../progressBar/ProgressBar.js";

const mbti = "infj";

// 右側に表示するもの
let right_content;
if(mbti.includes("p")){
    right_content = new P_Todo();
}
// J
else{
    right_content = new J_Todo();
}

// 左側にするもの
let left_content;
if(mbti.includes("s")){
    left_content = new ProgressBar(100);
}
// N
else{
    left_content = new ProgressBar(7);
}


// 
const left_area = document.getElementById("left_area");
const right_area = document.getElementById("right_area");

left_area.appendChild(left_content.elem);
right_area.appendChild(right_content.elem);