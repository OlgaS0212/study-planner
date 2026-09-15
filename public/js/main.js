const addTaskButton = document.getElementById("add-task-button");
const newTaskInput = document.getElementById("new-task-input");
const newTaskDate = document.getElementById("new-task-date");
const weekTaskList = document.getElementById("week-task-list");

if (addTaskButton && newTaskInput && newTaskDate && weekTaskList) {
  addTaskButton.addEventListener("click", () => {
    const taskText = newTaskInput.value.trim();
    const taskDateText = newTaskDate.value.trim();

    if (taskText === "" || taskDateText === "") {
      return;
    }

    const taskItem = document.createElement("div");
    taskItem.classList.add("week-item");

    const taskName = document.createElement("span");
    taskName.textContent = taskText;

    const taskDate = document.createElement("span");
    taskDate.textContent = taskDateText;

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Ta bort";
    deleteButton.classList.add("delete-task-button");

    deleteButton.addEventListener("click", () => {
      taskItem.remove();
    });

    taskItem.appendChild(taskName);
    taskItem.appendChild(taskDate);
    taskItem.appendChild(deleteButton);

    weekTaskList.appendChild(taskItem);

    newTaskInput.value = "";
    newTaskDate.value = "";
  });

  const deleteButtons = document.querySelectorAll(".delete-task-button");

  deleteButtons.forEach((button) => {
    button.addEventListener("click", () => {
      button.parentElement.remove();
    });
  });
}