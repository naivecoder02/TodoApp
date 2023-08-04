const express=require('express');
var session = require('express-session')
const app=express();
const fs=require("fs");

// express-session module to handle the login session and cookies
app.use(session({
    secret: 'DontKnow',
    resave: false,
    saveUninitialized: true,
}))

app.use(express.json());  // middleware to fetch method

app.use(express.urlencoded({extended:true})); // middleware for parsing the usernanme and password from the form

// app.use(express.static('public'));


// Signup page 
app.get("/signup",(req,res)=>{
    res.sendFile(__dirname+"/public/signup.html");
})

// Signup form post method handling

let existingData = [];

try {
  const data = fs.readFileSync("credentials.json", "utf8");
  existingData = JSON.parse(data);
} 
catch (err) {

}

app.post("/signup",(req,res)=>{
    const{name,email,password} = req.body;


    const cred = {username:name,
    email:email,
    password:password}

    existingData.push(cred);
  
    fs.writeFile("credentials.json", JSON.stringify(existingData), (err) => {
      if (err) throw err;
      console.log("User Registered Successfully");
    });
    res.redirect("/login");
});
// Signup form post method handling over 


//Login page  
app.get("/login",(req,res)=>{
    res.sendFile(__dirname+"/public/login.html");
});


// To handle the post method of the login form
app.post("/login", (req, res) => {
    const username = req.body.uname;
    const password = req.body.pass;
  
    try {
      const data = fs.readFileSync("credentials.json", "utf8");
      const userData = JSON.parse(data);
  
      // Find the user with the given username
      const user = userData.find((user) => user.username === username);
  
      if (user && user.password === password) {
        req.session.isLoggedIn = true;
        req.session.username= username;
        res.redirect("/");
      } else {
        res.send("Invalid credentials. Please try again.");
      }
    } catch (err) {
      res.status(500).send("Server error");
    }
  });
  


// Home page 
app.get("/",(req,res)=>{

    if(!req.session.isLoggedIn){
        res.redirect("/login");
        return;
    }
    res.sendFile(__dirname+"/public/index.html");
});



// Todo post method to handle the fetch from todoscript.js for saving todo in database
app.post("/todo",(req,res)=>{
    
    if(!req.session.isLoggedIn){
    res.redirect("/login");
    return;
    }

    saveAllTodos(req.body,(err)=>{
        if(err){
            res.status(500).send("error");
            return;
        }
        res.status(200).send("success");
    })
});


// To handle the fetch of the delete button 
app.post("/delTodo",(req,res)=>{
    const idselected = req.body.id;
    
    readAllTodos((err,todo)=>{
        if(err){
            res.status(500).json({result:"failure"})
            return;
        }
        else{
            todo.forEach((data,idx) => {
                if(data.id=== idselected){
                    todo.splice(idx,1);
                }
            });
        }
        fs.writeFile("./db.json",JSON.stringify(todo),(err)=>{
            if( err ){
                res.status(500).json({result:'failure W'});
            }
            
            res.status(200).json({result:'success'})
        });
    }); 
});


// To handle the fetch of the edit button
app.post("/editTodo",(req,res)=>{

    readAllTodos((err,todo)=>{
        if(err){
            res.status(500).json({update:'failed'});
            return;
        }

        const edited = req.body;
        console.log(edited.id);

        todo.forEach((data,idx)=>{
            console.log(data.id);
            if(data.id === edited.id){
                todo[idx].todoText = edited.data;
            }
        });

        fs.writeFile("./db.json",JSON.stringify(todo),(err)=>{
            if( err ){
                res.status(500).json({ update :'failed'});
            }
            
            res.status(200).json({update:'success'})
        });
    }); 
})

// To show the todos in UI
app.get("/todo-data",(req,res)=>{

    if(!req.session.isLoggedIn){
        res.redirect("/login");
        return;
    }

    readAllTodos((err,data)=>{
        if(err){
            res.status(500).send("error");
            return;
        }
        res.status(200).json(data);
    });
});

app.get("/about",(req,res)=>{

    if(!req.session.isLoggedIn){
        res.redirect("/login");
        return;
    }

    res.sendFile(__dirname+"/public/about.html");
});
app.get("/contact",(req,res)=>{

    if(!req.session.isLoggedIn){
        res.redirect("/login");
        return;
    }

    res.sendFile(__dirname+"/public/contact.html");
});
app.get("/todo",(req,res)=>{

    if(!req.session.isLoggedIn){
        res.redirect("/login");
        return;
    }

    res.sendFile(__dirname+"/public/todo.html");
});

app.get("/scripts/todoscript.js",(req,res)=>{
    res.sendFile(__dirname+"/scripts/todoscript.js");
});



app.listen(8080,()=>{
    console.log("The app is running at port http://localhost:8080");
});



function readAllTodos(callbacks){
    fs.readFile("./db.json","utf-8",(err,data)=>{
        if(err){
           callbacks(err);
            return;
        }
        if(data.length===0){
            data="[]";
        }
        try {
        data=JSON.parse(data); 
        callbacks(null,data);
        } 
        catch (err) {
            callbacks(err);
            return;
        }
    });
}


function saveAllTodos(todo,callbacks){
    readAllTodos((err,data)=>{
        if(err){
            callbacks(err);
             return;
         }
         data.push(todo); 
         fs.writeFile("./db.json",JSON.stringify(data),(err)=>{
            if(err){
                callbacks(err);
                return;
            }
            callbacks(null);
        }); 
    });
}