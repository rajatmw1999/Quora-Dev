//jshint esversion:6

const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const express = require('express');
const request = require('request');
const app= express();
const mongoose = require('mongoose');
const qna = require('./models/qna');

var login_id;

app.use(bodyParser.urlencoded({extended:true}));          //To make use of body parser.
app.set('view engine','ejs');                     //To make use of ejs
app.use(express.static('public'));                //To upload css files, sounds, images and other assests to the server... this public folder is fully uploaded
//mongoose.connect("mongodb+srv://rajat-admin:rajat1999@cluster0-nbxxl.mongodb.net/articledb",{useNewUrlParser: true});
 mongoose.connect("mongodb://localhost:27017/articledb",{useNewUrlParser: true});

const allNamesSchema = new mongoose.Schema({
  name:String
});
const Names = new mongoose.model('Name',allNamesSchema);

const loginSchema = new mongoose.Schema({
  username: String,
  pass: String,
  code: String
});

var loggedas = "user";

const LoginInfo = new mongoose.model('Password',loginSchema);

const articleSchema = new mongoose.Schema({
  topic: String,
  content: String,
  date: String,
  author: String
});

const Article = mongoose.model('Article', articleSchema);
var today = new Date();
var options={
  day:'numeric',
  month: 'long',
  year:'numeric'
};
var newspass;
var articledate = today.toLocaleDateString("en-US",options);

console.log(articledate);
var allregisterednames;

const projectSchema = new mongoose.Schema({
  author: String,
  url: String
});

const Project = new mongoose.model("project",projectSchema);

app.get('/',function(req,res){
  res.redirect('/login');
});

app.get('/users/:id/cd/:code',function(req,res){
  Names.find({},function(err,foundnames){
    allregisterednames = foundnames;
  });
  var questions;
  qna.find({},function(err, question){
  questions = question;
  });

  LoginInfo.findOne({username:req.params.id, code:req.params.code},function(err,foundid){
    if(foundid){
      Article.find({},function(err,allArticles){
        if(allArticles.length===0){
          const firstarticle = new Article({
          topic: "Hello There!",
          content: "Welcome to Quora for developers. As you can see, the interface is quite plane and easy to understand. If you want, you can write your own articles, or just go through the existing articles; your experience is totally personalised!",
          date: articledate,
          author: "admin"
          });
          firstarticle.save();
          res.redirect('/users/' + req.params.id + '/cd/' + req.params.code);
        }else{
          Project.find({},function(err1,foundProjects){
            res.render('home',{totalQ:questions.length, displayArticles:allArticles, userid:req.params.id, allNames:allregisterednames, code:req.params.code, projects:foundProjects});
          });
        }
    });
  }
        else{
          res.send("Error! 404 not found!");
        }
      });
  });

app.get('/users/:id/cd/:code/latestnews',function(req,res){
  var newsUrl = "https://newsapi.org/v2/top-headlines?apiKey=b78b7228021b496ba9eecf66e070ad57&sources=techcrunch";

  LoginInfo.findOne({username:req.params.id, code:req.params.code},function(err,foundid){
    if(foundid){
      request(newsUrl,function(error,response,body){
      var newsResult = response.body;
       newsResult = JSON.parse(newsResult);
       newsResult = newsResult.articles;
      // console.log(newsResult.articles[0].title);
      res.render('news',{newsArticles:newsResult, type:"Tech", userid:req.params.id, code:req.params.code});
    });
  }
        else{
          res.send("Error! 404 not found!");
        }
      });

});

app.get('/users/:id/cd/:code/qna',function(req,res){
  LoginInfo.findOne({username:req.params.id, code:req.params.code},function(err,foundid){
    if(foundid){
      qna.find({},function(err, allQuestions){
      res.render('qna',{userid:req.params.id, code:req.params.code, questions:allQuestions});
    });
  }else{
          res.send("Error! 404 not found!");
        }
      });
});

var wontsave=0;

app.post('/',function(req,res){
  wontsave=0;
  var newAuthor = req.body.button;
  var newContent = req.body.content;
  var newTopic = req.body.topic;
var code = req.body.buttonCode;
  const dynamicarticle = new Article({
  topic: newTopic,
  content: newContent,
  date: articledate,
  author: newAuthor
  });
  dynamicarticle.save();
  LoginInfo.findOne({username:newAuthor},function(err,found){
    if(found){
      res.redirect('/users/' + newAuthor + '/cd/' + found.code);
    }
    else{
      console.log("Error=" + err);
    }
  });
});
const saltRounds = 10;

app.post('/signup',function(req,res){

const userword = req.body.user;
const password = req.body.passcode;
const name =  req.body.name;
const code =  password.substring(0,4);
console.log(code);
const newName = new Names({
  name:name
});

newName.save();

bcrypt.hash(password,saltRounds,function(err,hash){
  if(err)
    console.log(err);
  else {
        const newlogindata = new LoginInfo({
          username:userword,
          pass: hash,
          code:code
        });
        newlogindata.save();
        console.log("Successfully Signed UP");
        loggedas = userword;
        res.redirect('/users/' + userword + '/cd/' + code);
  }
});

});

app.post('/login',function(req,resp){
  const userword = req.body.user;
  const password = req.body.passcode;

  const code =  password.substring(0,4);
  LoginInfo.findOne({username:userword},function(err,found){
    if(found){
      const checkuser = found.username;
      bcrypt.compare(password,found.pass,function(err,res){
        if(res===true)
        {
          console.log("Successfully logged in");
          loggedas = userword;
          resp.redirect('/users/' + userword + '/cd/' + code);
        }
        else{
          resp.render('login', {message:"Wrong password."});
        }
      });
    }
    else{
      resp.render('login',{message:"No account with this username exists."});
    }
  });

});

app.get('/login',function(req,res){
  res.render('login',{message:""});
});

app.get('/signup',function(req,res){

  res.render('signup');

});


app.post('/projectUrl',function(req,res){
  var link = req.body.project;
  const newProject = new Project({
    author:req.body.button,
    url:link
  });
  newProject.save();
  LoginInfo.findOne({username:req.body.button},function(err,found){
    if(found){
      res.redirect('/users/' + req.body.button + '/cd/' + found.code);
    }
    else{
      console.log("Error=" + err);
    }
  });
});

app.get('/users/:userid/articles/:id/:code',function(req,res){
  const idOfArticle = req.params.id;
  Article.findOne({_id:idOfArticle},function(err,found){
    res.render('articlesPage',{articleTopic:found.topic, articleContent:found.content, userid:req.params.userid, code:req.params.code});
  });
});

app.get('/bored',function(req,res){
  res.render('bored');
});

app.get('/bored/uselessfacts',function(req,res){
    var factUrl = "https://uselessfacts.jsph.pl/random.json?language=en";
      request(factUrl,function(error,response,body){
      var facts = response.body;
       facts = JSON.parse(facts);
       facts = facts.text;
      res.render('uselessfacts',{fact:facts,option:"uselessfacts"});
    });
});

app.get('/bored/geekjoke',function(req,res){
    var factUrl = "https://geek-jokes.sameerkumar.website/api";
      request(factUrl,function(error,response,body){
      var facts = response.body;
       facts = JSON.parse(facts);
      // facts = facts.text;
      res.render('uselessfacts',{fact:facts,option:"geekjoke"});
    });
});

app.get('/bored/bill',function(req,res){
  res.render('belikebill');
});

app.post('/belikebill',function(req,res){
  res.render('belikebillimage',{src:"https://belikebill.ga/billgen-API.php?default=1&name=" + req.body.name + "&sex=m"});
});

app.post('/users/:userid/cd/:code/newQ',function(req,res){
  var question = req.body.question;
  const newQna = new qna({
    que:question
  });
  newQna.save();
  res.redirect('/users/' + req.params.userid + '/cd/'+req.params.code+'/qna');
});

app.get('/users/:userid/cd/:code/:questionid',function(req,res){
  qna.findOne({_id:req.params.questionid},function(err,found){
  res.render('answers',{userid:req.params.userid,code:req.params.code, question:found});
  });
});


app.get('/users/:userid/cd/:code/:questionid/answer',function(req,res){
  qna.findOne({_id:req.params.questionid},function(err,found){
  res.render('answeraquestion',{userid:req.params.userid,code:req.params.code, question:found});
  });
});

app.post('/users/:userid/cd/:code/:questionid/answered', function(req,res){
  qna.findOne({_id:req.params.questionid},function(err,found){

    found.ans.push(req.body.answercontent);

    found.save();
  res.redirect('/users/'+req.params.userid+'/cd/' + req.params.code + '/' + req.params.questionid);
  });
});


app.listen(process.env.PORT || 3000,function(){
  console.log('Server is running successfully on port 3000!');
});
