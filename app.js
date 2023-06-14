const express = require("express");
const app = express();
app.use(express.json());

const {open} = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

var isValid = require('date-fns/isValid');
var format = require('date-fns/format');

//initialization
let db = null;

const initializeDbAndServer= async()=>{
try{
db = await open({
    filename : dbPath,
    driver : sqlite3.Database,
});
app.listen(3000, ()=>{
    console.log("Server is Running");
});
    } catch(e){
        console.log(`DB Error : ${e.message}`);
        process.exit(1);
    }
}
initializeDbAndServer();

convertToCamelCase = (dbObject)=>{
    return{
        id : dbObject.id,
        todo : dbObject.todo,
        priority : dbObject.priority,
        status : dbObject.status,
        category : dbObject.category,
        dueDate : dbObject.due_date,        
    }
};

const hasStatusAndPriority = (requestQuery)=>{
    return(
        requestQuery.priority !== undefined && 
        requestQuery.status !== undefined
    );
};

const hasCategoryAndStatus=(requestQuery)=>{
    return(
        requestQuery.category!== undefined && requestQuery.status!== undefined
    )
};

const hasCategoryAndPriority = (requestQuery)=>{
    return(
        requestQuery.category !== undefined && requestQuery.priority!== undefined
    )
};

const hasStatus = (requestQuery) =>{
    return requestQuery.status !== undefined
};

const hasPriority = (requestQuery)=>{
    return requestQuery.priority !== undefined
};

const hasCategory = (requestQuery)=>{
    return requestQuery.category !== undefined
};

const statusCheck = (status)=>{
    if (status === "TO DO" || status === "IN PROGRESS" || status ==="DONE"){
        return true
    } else{
        return false
    }
}

const priorityCheck=(priority)=>{
    if (priority==="HIGH" || priority ==="MEDIUM" || priority==="LOW"){
        return true
    } else{
        return false
    }
}

const categoryCheck = (category)=>{
    if (category==="WORK" || category ==="HOME"|| category==="LEARNING"){
        return true
    } else{
        return false
    }
}

//Get Todos
app.get("/todos/",async (request, response)=>{
    let getTodoQuery = null;
    const {search_q = "", priority, status, category} = request.query;
    let data = null;

    switch (true) {
        case hasStatusAndPriority(request.query):
            if (statusCheck(`${status}`)===true){
                if (priorityCheck(`${priority}`)===true){
                    getTodoQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" 
                    AND status = "${status}" AND priority = "${priority}";`;                    
                } else{
                    response.status(400);
                    response.send("Invalid Todo Priority");
                }
            } else{
                response.status(400);
                response.send("Invalid Todo Status");
            }
            break;
        case hasCategoryAndStatus(request.query):
            if (statusCheck(`${status}`)===true){
                if (categoryCheck(`${category}`)===true){
                    getTodoQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%"
                    AND category = "${category}" AND status = "${status}";`;                
                }else{
                    response.status(400);
                    response.send("Invalid Todo Category");
                }
            } else{
                response.status(400);
                response.send("Invalid Todo Status");
            } 
            break;
        case hasCategoryAndPriority(request.query):
            if(categoryCheck(`${category}`)===true){
                if(priorityCheck(`${priority}`)===true){
                    getTodoQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" 
                    AND category = "${category}" AND priority = "${priority}";`;                    
                } else{
                    response.status(400);
                    response.send("Invalid Todo Priority");
                }
            } else{
                response.status(400);
                response.send("Invalid Todo Category");
            }
            break;
        case hasStatus(request.query):
            if(statusCheck(`${status}`)===true){
                getTodoQuery = `SELECt * FROM todo WHERE todo LIKE "%${search_q}%"
            AND status = "${status}";`;
            } else{
                response.status(400);
                response.send("Invalid Todo Status");
            }
            break;
        case hasPriority(request.query):
            if(priorityCheck(`${priority}`)===true){
                getTodoQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%"
                AND priority = "${priority}";`;
            } else{
                response.status(400);
                response.send("Invalid Todo Priority");
            }
            break;
        case hasCategory(request.query):
            if(categoryCheck(`${category}`)===true){
                getTodoQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%"
                AND category = "${category}";`;
            } else{
                response.status(400);
                response.send("Invalid Todo Category");
            }
            break;
        default:
            getTodoQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%";`;
    }
    
    data = await db.all(getTodoQuery);
    const result = data.map((each)=> convertToCamelCase(each));
    response.send(result);
});

//Get Todo with todoId
app.get("/todos/:todoId/",async (request, response)=>{
    const {todoId} = request.params;
    const getTodoQuery = `SELECT * FROM todo WHERE id = "${todoId}";`;
    const todo = await db.get(getTodoQuery);
    response.send(convertToCamelCase(todo));
});

app.get("/agenda/",async (request, response)=>{
    const {date} = request.query;
    
    if (date === undefined){
        response.status(400);
        response.send("Invalid Due Date");
    } else {
        const isDateValid = isValid(new Date(date));
        if (isDateValid){
            const formattedDate = format(new Date(date), "yyyy-MM-dd");
            const getQuery = `SELECT id, todo, priority, status, category, due_date as dueDate
            FROM todo WHERE due_date = "${formattedDate}";`;
            const todos =await db.all(getQuery);
            response.send(todos);
        } else{
            response.status(400);
            response.send("Invalid Due Date");
        }
    }
});

app.post("/todos/",async (request, response)=>{
    const {id, todo, priority, status, category, dueDate} = request.body;
    console.log(priorityCheck(`${priority}`));

    if (priorityCheck(`${priority}`)){
        if (statusCheck(`${status}`)){
            if (categoryCheck(`${category}`)){
                if(isValid(`${dueDate}`)){
                    const postTodoQuery = `INSERT INTO todo (id, todo, priority, status, category, due_date)
                    VALUES ("${id}", "${todo}", "${priority}", "${status}", "${category}", "${dueDate}");`;
                    await db.run(postTodoQuery);
                    response.send("Todo Successfully Added");
                } else{
                    response.status(400);
                    response.send("Invalid Due Date");
                }
            }else{
                response.status(400);
                response.send("Invalid Todo Category");
            }
        }else{
            response.status(400);
            response.send("Invalid Todo Status");
        }
    }else{
        response.status(400);
        response.send("Invalid Todo Priority");
    }
});

app.put("/todos/:todoId/", async (request, response)=>{
    const {todoId} = request.params;
    const requestBody = request.body;
    let updateColumn = "";
    switch (true){
        case requestBody.status !== undefined:
            if (statusCheck(requestBody.status)){
                updateColumn = "Status";
            } else{
                response.status(400);
                response.send("Invalid Todo Status");
            }
            break;
        case requestBody.priority !== undefined:
            if (priorityCheck(requestBody.priority)){
                updateColumn = "Priority";
            } else{
                response.status(400);
                response.send("Invalid Todo Priority");
            }
            
            break;
        case requestBody.category !== undefined:
            if(categoryCheck(requestBody.category)){
                updateColumn = "Category";
            } else{
                response.status(400);
                response.send("Invalid Todo Category");
            }
            break;
        case requestBody.todo !== undefined:
            updateColumn = "Todo";
            break;
        case requestBody.dueDate!== undefined:
            updateColumn = "Due Date";
            break;
    }
    const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
    const previousTodo = await db.get(previousTodoQuery);
    const {todo = previousTodo.todo, priority = previousTodo.priority,
    status = previousTodo.status, category = previousTodo.category, 
    dueDate = previousTodo.due_date} = request.body;
    const updateTodoQuery = `UPDATE todo SET todo ="${todo}", priority = "${priority}", 
    status = "${status}", category = "${category}", due_date = "${dueDate}"
    WHERE id = ${todoId};`;
    await db.run(updateTodoQuery);
    response.send(`${updateColumn} Updated`);
    
});

app.delete("/todos/:todoId/",async (request, response)=>{
    const {todoId} = request.params;
    const deleteTodoQuery = `DELETE * FROM todo WHERE id = ${todoId};`;
    await db.run(deleteTodoQuery);
    response.send("Todo Deleted");
});

module.exports = app;
