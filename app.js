const express = require("express");
const addDate = require("date-fns");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const toDate = require("date-fns/toDate");
const app = express();
app.use(express.json());
const path = require("path");

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializationOfDbServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`);
    process.exit(1);
  }
};

initializationOfDbServer();

const getRequestFromQuery = async (req, res, next) => {
  const { search_q, status, priority, category, date } = req.query;
  const { todoId } = req.params;

  if (status !== undefined) {
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    const statusIsInArray = statusArray.includes(status);
    if (statusIsInArray === true) {
      req.status = status;
    } else {
      res.status(400);
      res.send("Invalid Todo Status");
      return;
    }
  }

  if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    const categoryIsInArray = categoryArray.includes(category);
    if (categoryIsInArray === true) {
      req.category = category;
    } else {
      res.status(400);
      res.send("Invalid Todo Category");
      return;
    }
  }
  if (priority !== undefined) {
    const priorityArray = ["HIGH", "MEDIUM", "LOW"];
    const priorityIsInArray = priorityArray.includes(priority);
    if (priorityIsInArray === true) {
      req.priority = priority;
    } else {
      res.status(400);
      res.send("Invalid Todo Priority");
      return;
    }
  }

  if (date !== undefined) {
    try {
      const myDate = new Date(date);
      const formatedDate = format(new Date(date), "yyyy-MM-dd");
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${myDate.getMonth() + 1}-${myDate.getDate()}`
        )
      );
      console.log(result);
      const isValidDate = await isValid(result);
      if (isValidDate === true) {
        req.date = formatedDate;
      } else {
        res.status(400);
        res.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      res.status(400);
      res.send("Invalid Due Date");
      return;
    }
  }
  req.todoId = todoId;
  req.search_q = search_q;
  next();
};

const getRequestsFromBody = (req, res, next) => {
  const { id, todo, status, category, priority, dueDate } = req.body;
  const { todoId } = req.params;

  if (status !== undefined) {
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    const statusIsInArray = statusArray.includes(status);
    if (statusIsInArray === true) {
      req.status = status;
    } else {
      res.status(400);
      res.send("Invalid Todo Status");
      return;
    }
  }

  if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    const categoryIsInArray = categoryArray.includes(category);
    if (categoryIsInArray === true) {
      req.category = category;
    } else {
      res.status(400);
      res.send("Invalid Todo Category");
      return;
    }
  }
  if (priority !== undefined) {
    const priorityArray = ["HIGH", "MEDIUM", "LOW"];
    const priorityIsInArray = priorityArray.includes(priority);
    if (priorityIsInArray === true) {
      req.priority = priority;
    } else {
      res.status(400);
      res.send("Invalid Todo Priority");
      return;
    }
  }

  if (dueDate !== undefined) {
    try {
      const myDate = new Date(dueDate);
      const formatedDate = format(new Date(dueDate), "yyyy-MM-dd");
      const result = toDate(new Date(formatedDate));

      const isValidDate = isValid(result);
      if (isValidDate === true) {
        req.dueDate = formatedDate;
      } else {
        res.status(400);
        res.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      res.status(400);
      res.send("Invalid Due Date");
      return;
    }
  }
  req.id = id;
  req.todo = todo;
  req.todoId = todoId;
  next();
};

//API 1
app.get("/todos/", getRequestFromQuery, async (req, res) => {
  const { status = "", priority = "", category = "", search_q = "" } = req;
  const getDetailsOfTodo = `
    SELECT
     id,
     todo,
     priority,
     status,
     category,
     due_date AS dueDate
    FROM 
     todo
    WHERE todo 
     LIKE '%${search_q}%' AND priority LIKE '%${priority}%'
     AND status LIKE '%${status}%' AND category LIKE '%${category}%';`;
  const result = await db.all(getDetailsOfTodo);
  res.send(result);
});

//API 2
app.get("/todos/:todoId", getRequestFromQuery, async (req, res) => {
  const { todoId } = req;

  const getTodosQuery = `
        SELECT 
            id,
            todo,
            priority,
            status,
            category,
            due_date AS dueDate
        FROM 
            todo            
        WHERE 
            id = ${todoId};`;

  const todo = await db.get(getTodosQuery);
  res.send(todo);
});

//API 3
app.get("/agenda/", getRequestFromQuery, async (req, res) => {
  const { date } = req;
  const getDetailsByDate = `
  SELECT 
   id,
   todo,
   priority,
   status,
   category,
   due_date AS dueDate
  FROM
   todo 
  WHERE 
   dueDate = '${date}'`;
  const result = await db.all(getDetailsByDate);
  if (result === undefined) {
    res.status(400);
    res.send("Invalid Due Date");
  } else {
    res.send(result);
  }
});

//API 4
app.post("/todos/", getRequestsFromBody, async (req, res) => {
  const { id, todo, priority, status, category, dueDate } = req;
  const addDetails = `
      INSERT INTO todo(id,todo,priority,status,category,due_date)
      VALUES (
          ${id},
          '${todo}',
          '${priority}',
          '${status}',
          '${category}',
          '${dueDate}'

      );
  `;
  const result = await db.run(addDetails);
  res.send("Todo Successfully Added");
});

//API 5

app.put("/todos/:todoId", getRequestsFromBody, async (req, res) => {
  const { todo, status, priority, category, dueDate } = req;
  const { todoId } = req;

  let updatedListTodo = "";

  switch (true) {
    case status !== undefined:
      updatedListTodo = `UPDATE todo SET status='${status}' WHERE id=${todoId}`;
      await db.run(updatedListTodo);
      res.send("Status Updated");
      break;
    case priority !== undefined:
      updatedListTodo = `UPDATE todo SET priority = '${priority}' WHERE id=${todoId}`;
      await db.run(updatedListTodo);
      res.send("Priority Updated");
      break;
    case todo !== undefined:
      updatedListTodo = `UPDATE todo SET todo='${todo}' WHERE id=${todoId}`;
      await db.run(updatedListTodo);
      res.send("Todo Updated");
      break;
    case category !== undefined:
      updatedListTodo = `
      UPDATE
       todo 
      SET
       category='${category}'
      WHERE
       id=${todoId}`;
      await db.run(updatedListTodo);
      res.send("Category Updated");
      break;
    case dueDate !== undefined:
      updatedListTodo = `
        UPDATE
         todo 
        SET
         due_date='${dueDate}'
        WHERE
         id=${todoId}`;
      await db.run(updatedListTodo);
      res.send("Due Date Updated");
  }
});

//API 6
app.delete("/todos/:todoId", async (req, res) => {
  const { todoId } = req.params;
  const deleteById = `DELETE FROM todo WHERE id=${todoId}`;
  const result = await db.run(deleteById);
  res.send("Todo Deleted");
});

module.exports = app;
