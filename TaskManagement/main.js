import { P_Todo } from "../P_Todo/P_Todo.js";
import { J_Todo } from "../J_Todo/J_Todo.js";

const mbti = "infj";
if(mbti.includes("p")){}
const left_area = document.getElementById("left_area");
const right_area = document.getElementById("right_area");

left_area.appendChild(new P_Todo());
right_area.appendChild(new J_Todo());