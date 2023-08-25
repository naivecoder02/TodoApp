const express=require('express');
var session = require('express-session')
const fs=require("fs");

// middle ware for handling the multimedia files such as photos and videos 
const multer = require('multer');

const multerStorage = multer.diskStorage({
    destination:(req,file,callback)=>{
        callback(null,__dirname+'/uploads');
    },
    filename:( req, file, callback )=>{
        callback( null, file.originalname );
    },
});



const upload = multer({storage: multerStorage});


const app=express();

app.set("view engine","ejs");


// express-session module to handle the login session and cookies
app.use(session({
    secret: 'DontKnow',
    resave: false,
    saveUninitialized: true,
}))

app.use( function(req,res, next ) {
    console.log(req.url, req.method );
    next()
})

app.use(express.json());  // middleware to fetch method

app.use(express.urlencoded({extended:true})); // middleware for parsing the usernanme and password from the form

app.use(upload.single('todoimg'));

// To get the profile pic of the particular user form the uploads folder at runtime 
app.use(express.static('uploads'));


// To handle the todo form



app.post("/addTodata", (req, res) => {
    const todoText = req.body.todoText;
    const priority = req.body.priority;
    const filename = req.file.originalname;

    var a = filename;
    console.log(a);

    // Check if the required fields are provided
    if (!todoText || !priority || !filename) {
        res.render('todo', { username: req.session.username, error: 'Enter valid todo and image' });
        return;
    }

    // Create a todo object
    const id = Math.floor(Math.random() * 10000000000000001);


    const todo = {
        id,
        todoText,
        priority,
        filename,
        saved: 'no'
    };

    // Save the todo using your saveAllTodos function or similar logic
    saveAllTodos(todo, (err) => {
        if (err) {
            throw err;
        }
    });

    res.redirect('/todo');
});




// Signup page 
app.get("/signup",(req,res)=>{
    res.render("signup");
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
    password:password,
   } 

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
    res.render("login",{error:null});
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
        res.render("login",{error:"Invalid username or password"});
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
    res.render("index",{username:req.session.username});
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
});

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

    res.render("about",{username:req.session.username});
});




app.get("/contact",(req,res)=>{

    if(!req.session.isLoggedIn){
        res.redirect("/login");
        return;
    }

    res.render("contact",{username:req.session.username});
});



app.get("/todo",(req,res)=>{

    if(!req.session.isLoggedIn){
        res.redirect("/login");
        return;
    }

    res.render("todo",{username:req.session.username});
});

// To handle the logout button 
app.get("/logout", (req, res) => {
    // Destroy the session to logout the user
    req.session.destroy((err) => {
        if (err) {
            res.status(500).send("Server error");
            return;
        }
        // Redirect the user to the login page after logout
        res.redirect("/login");
    });
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
