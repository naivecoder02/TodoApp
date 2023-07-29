const btn = document.getElementById('btnId');
const todoInput = document.getElementById("newTodoInput");
const prioritySelectorNode= document.getElementById("prioritySelector");
const ul = document.getElementById("todos");
// import { v4 as uuidv4 } from 'uuid';

btn.addEventListener('click', function(){


const todoText = todoInput.value;
const priority = prioritySelectorNode.value;

if(!todoText || !priority){
    alert("Please enter a todo");
    return;
}


let id = Math.floor(Math.random() * 10000000000000001);
const todo ={
    id,
    todoText,
    priority
};

//  ul.appendChild(ele)

  fetch("/todo",{
    method:"POST",
    headers:{"Content-Type":"application/json",},
    body:JSON.stringify(todo), 
  }).then(function(response){
        if(response.status == 200){
            // display todo in ui
            showToDo(todo);
        }
  });
});



function showToDo(todo){
    const todoTextNode=document.createElement("div");
    todoTextNode.innerText=todo.todoText;


    const editBtn = document.createElement("button");
    editBtn.classList.add("edit-btn");
    editBtn.innerText = "Edit";


    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-btn");
    deleteBtn.innerText = "Delete";


    ul.appendChild(todoTextNode);
    todoTextNode.appendChild(editBtn);
    todoTextNode.appendChild(deleteBtn);

    // delete button functioning

    deleteBtn.addEventListener("click",()=>{
        const ID ={
            id:todo.id
        }
        fetch("/delTodo",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify(ID) 
        }).then((response)=>{
            if(response.status === 200){
                window.location.reload();
            }
            else{
                console.log(response.json())
                alert('Something wrong in todo')
            }
        });
    });


    editBtn.addEventListener("click",()=>{
        const edit=prompt("What is your next task..?");

        if(edit){

            const to={
                id:todo.id,
                data:edit
            }
            // var a = todo;
            fetch("/editTodo",{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify(to)
            }).then((response)=>{
                if(response.status === 200){
                    window.location.reload();
                }
                else{
                    // console.log(response.json());
                    alert('Something wrong in todo')
                }
            });
        }
    });

}




fetch("/todo-data").then((response)=>{
    if(response.status ===200){
        return response.json();
    }
    else{
        alert("something went wrong");
    }
}).then((todos)=>{
    todos.forEach((todo) => {
        showToDo(todo);
    });
}); 
