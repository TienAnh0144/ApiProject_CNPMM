const express = require('express')
var app =  express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var User = require ('./app/models/user');
var jwt = require('jsonwebtoken');
var superSecret = 'toihocmean';

var port = process.env.PORT || 8080;

//connect
mongoose.connect('mongodb+srv://myMongoDBUser:Abc123456@cluster0.fkfwh.mongodb.net/DoAn',{ useNewUrlParser:true},()=>{
  console.log('Conect dbmonggo');
});

app.use(bodyParser.urlencoded({extended :true}));
app.use(bodyParser.json());

app.use(function(req,res,next){
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
   res.setHeader('Access-Control-Allow-Headers','X-Requested-With,content-type,Authorization');
   next();
});

app.use(morgan('dev'));

app.get('/', function(req, res){
  res.send('Wellcome to Home page');
});

var apiRouter = express.Router();
apiRouter.use(function(req,res,next){
  console.log('Dang lam tren App');
  // next();
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  if(token){
    jwt.verify(token,superSecret,function(err,decoded){
      if(err){
        return res.json({
          success:false, 
          message:'Failed to authentication token'
        });
      }else{
        req.decoded = decoded;
        next();
      }
    })
  } 
  else{
    return res.status(403).send({
      success: false,
      message:'No token provided'
    });
  }
});

apiRouter.get('/',function(req,res){
  res.json({message: 'vi du dau tien ve API'});
});
apiRouter.get('/login', (req, res) => res.render('login'));
app.use('/api', apiRouter);

app.listen(port);
console.log('Port can dung la'+ port);

apiRouter.route('/users').post(function(req,res){
  var user  = new User();

  user.name = req.body.name;
  user.username = req.body.username;
  user.password = req.body.password;

  user.save(function(err){
    if(err){
      if(err.code==11000)
      return res.json({success:false, message: 'A User with that username already exists.'});
      else
      return res.send(err);
    }
    res.json({message:'User Created'});
  })
})
.get(function(req,res){
  User.find(function(err,users){
    if(err) return res.send(err);

    res.json(users);
  })
})

apiRouter.route('/users/:user_id')
.get(function(req,res){
  User.findById(req.params.user_id,function(err,user){
    if(err) return res.send(err);
    res.json(user);
  })
})

.put(function(req,res){
  User.findById(req.params.user_id,function(err,user){
    if(err) return res.send(err);
    if(req.body.name) user.name=req.body.name;
    if(req.body.username) user.username=req.body.username;
    if(req.body.password) user.password=req.body.password;

    user.save(function(err){
      if(err) return res.send(err);
      res.json({message:'User Updated!'})
    })
  })
})

.delete(function(req,res){
  User.remove({
    _id:req.params.user_id
  },function(err,user){
    if(err) return res.send(err);
    res.json({message:'Deleted Successfully!'})
  })
});

apiRouter.post('/authenticate', function(req,res) {
  User.findOne({
    username : req.body.username
  }).select('name user password').exec(function(err, user){
    if(err) throw err;

    if(!user){
      res.json({
        success: false,
        message:'Authentiation Failed. User not found'
      });
    } else if(user){
      var validPassword = user.comparePassword(req.body.password);
      if(!validPassword) {
        res.json({
          success: false,
          message:'Authentication Failed. Wrong Password'
        });
      } else{
        var token = jwt.sign({
          name: user.name,
          username: user.username
        }, superSecret, {
          expiresIn : '24h'
        });

        res.json({
          success: true,
          message:'Lam viec voi Token!',
          token: token
        });
      }
    }
  });
});

