/*!
 * All rights reserved.
 * Licensed under the MIT License.
 */
import { questionList } from "./questionList";

export function getQuestion() {
    let length = questionList().questions.length;
    let randomNumber = Math.floor(Math.random() * length);
    return questionList().questions[randomNumber];
}