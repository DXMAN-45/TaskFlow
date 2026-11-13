tasks

title - name of the task
description - describing what is the task 
assigned to - person its assigned to 
project - either projec it pbelongs too or no project showing its personal solo task 
due date - either deadline date or no date showing no deadline 
created at - date of taskl creation]
created by - person who created it 
priority -  telling how important the task is
status - by default todoi and them in progress or completed based whuch will be changedby user later on overdue will be caluculated if there is deadline 



projects 



  {
    id: 1,
    name: "TaskFlow Website",name of the project 
    description:
      "Building a clean and intuitive task management experience for teams.",description of the projetc 
    category: "Product Development", catogary of project 
    status: "In progress", waht is the status  based on tasks all task coimpleted measnprojct completed no task completed measn no started and if even one task is completed inprohgress
    priority: "High", importance eel 
    progress: 0, task completed 
    tasks: [
       {
    id: 1,
    title: "Redesign user profile",
    description: "Update the profile layout and improve the user experience.",
    assignedTo: "You",
    project: "TaskFlow Website",
    dueDate: "2026-11-14",
    createdAt: "2026-11-12",
    createdBy: "You",
    priority: "High",
    status: "In progress",
  },
  {
    id: 2,
    title: "Create dashboard widgets", 
    description: "Build responsive cards for the dashboard overview.", 
    assignedTo: "Riya",
    project: "TaskFlow Website",
    dueDate: "2026-11-16",
    createdAt: "2026-11-12",
    createdBy: "You",
    priority: "Medium",
    status: "In progress",
  },
    members: ["MS", "RS", "AM"],  intial of names of members first name and last name  inbtials 
    memberNames: ["Mandeep Singh", "Riya Sharma", "Alex Morgan"], members in project including admin owner oand normal member
    owner: "Mandeep Singh", owener who created the project 
    admin : Riya Sharma admin this person can do everthing but can't delete the project 
    deadline: "2026-11-28", deadsline of the proct 
    createdAt: "2026-09-12", dsat of creation 

teams data 



















