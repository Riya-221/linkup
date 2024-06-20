require('dotenv').config() ;

const express= require('express') ;
const bcrypt= require('bcrypt') ;
const jwt= require('jsonwebtoken') ;
const cors= require('cors') ;
const cookieParser= require('cookie-parser') ;
const path = require('path')
const bodyparser = require('body-parser')

const authRouter= require('./routers/authRouter') ;
const postRouter = require('./routers/postRouter');
const myRouter = require('./routers/myRouter');
const authenticateUser = require('./middlewares/auth') ; 

const users= require("./models/userModel") ;
const posts= require("./models/postModel") ;


const app=  express() ;

const mongoose = require('mongoose');
const url = "mongodb://0.0.0.0:27017" ;
mongoose.connect(url)
.then(()=>{
    console.log("mongodb connected") ;
})
.catch((error)=>{
    console.error("failed to connect", error.message)  ;
})





// const authenticateUser = async (req, res, next) => {
//     try {
//         const token = req.cookies.token;
//         if (!token) {
//             return res.status(401).send('Unauthorized');
//         }

//         const decoded = jwt.verify(token, 'process.env.REFRESHTOKENSECRET');
//         const user = await users.findById(decoded.id);
//         if (!user) {
//             return res.status(404).send('User not found');
//         }

//         req.user = user;
//         next();
//     } catch (err) {
//         res.status(500).send('Internal Server Error');
//     }
// };
// app.use(authenticateUser);




app.use(express.json()) ;
app.use(cors()) ;
app.use(cookieParser()) ;
app.set('view engine', 'ejs');
app.set('views',path.join(__dirname, './views'));
app.use(express.static(path.join(__dirname , './public'))) ;
app.use(bodyparser.json()) ;
app.use(bodyparser.urlencoded({ extended: true }));


app.use('/api',authenticateUser,authRouter) ;
app.use('/api', postRouter);
app.use('/api', myRouter);


app.get('/',(req,res)=>{
    res.render('signin') ;
});
app.get('/signup',(req,res)=>{
    res.render('signup') ;
});
app.get('/home/:username', async (req, res) => {
    try {
        const user = await users.findOne({name: req.params.username})
        if (!user) {
            return res.status(404).send('User not found');
        }
        const array = await posts.find().populate('user', 'name');
        // const shuffledPosts = shuffle(posts_data);
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        res.render('home', { posts: array, user });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/api/profile/:username',async(req,res) => {
    try {
        const user = await users.findOne({name: req.params.username})
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.render('profile', { user });
    } catch (err) {
        res.status(500).send(err.message);
    }
}); 




app.post('/',async(req,res)=>{
    try{
        const data={
            email: req.body.email,
            pswd: req.body.pswd
        }
        const check= await users.findOne({email: data.email})
        .populate("followers following", "-pswd") ;
        if(!check)
        return res.status(400).json({msg:"user doesn't exist"}) ;

        const userP= await bcrypt.compare(data.pswd,check.pswd) ; 
        if(!userP)
        return res.status(400).json({msg:"Wrong password"}) ;

        const atk= createAccessToken({id: check._id}) ;
        const rtk= createRefreshToken({id: check._id}) ;

        res.cookie('refreshtoken',rtk,{
            httpOnly: true,
            path: "/api/rtk",
            maxAge: 24*30*60*60*1000
        })

        // res.json({msg: "signin done"}) ;
        res.redirect(`/home/${check.name}`);

    } catch(err){
        res.status(500).json({msg:err.message}) ;
    }
});

app.post('/signup',async(req,res)=>{
    try{
        // console.log('Handling POST request for /signup');
        // const {name,email,pswd,gender}= req.body ;
        const data={
            name:req.body.name,
            email:req.body.email,
            pswd:req.body.pswd,
            gender:req.body.gender
        }
        // const username= data.name.toLowerCase().replace(/ /g,'') ;
        const check = await users.findOne({name: data.name}) ;
        if(check){
            return res.status(400).json({msg:"Username already exists"}) ;
            // alert("Username already exists") ;
            // res.redirect('/register') ;
        }
        if(data.pswd.length<3){
            return res.status(400).json({msg:"Password must be atleast 3 characters"}) ;
        }
        const pswdHash= await bcrypt.hash(data.pswd,13) ;
        
        const myUser= new users({
            name:data.name, email:data.email, pswd: pswdHash,gender:data.gender 
        })

        console.log(myUser) ;
        await myUser.save() ;

        const atk= createAccessToken({id: myUser._id}) ;
        const rtk= createRefreshToken({id: myUser._id}) ;
        res.cookie('refreshtoken',rtk,{
            httpOnly: true ,
            path: "/api/rtk",
            maxAge: 24*30*60*60*1000
        })

        // res.json({msg: "registered"}) ;
        res.redirect(`/home/${data.name}`);

    } catch(err){
        console.log(err) ;
        res.status(500).json({msg:err.message}) ;
    }
});




app.post('/signout',async(req,res)=>{
    try{
        res.clearCookie('refreshtoken', {path:'/api/rtk'})
        res.json({msg:'logged out'}) ;
    } catch(err){
        res.status(500).json({msg:err.message}) ;
    }
});


app.post('/profile',async(req,res)=>{
    try{
        const { username,email, password, address, phone, gender, about } = req.body;
        const user = await users.findOne({name:username});
        // if (!user) {
        //     return res.status(404).send('User not found');
        // }
        user.email = email;
        if (password) {
            user.pswd = await bcrypt.hash(password, 13) ;
        }
        user.addr = address;
        user.phone = phone;
        user.gender = gender;
        user.about = about;

        await user.save();

        res.redirect(`/api/profile/${user.name}`);
    } catch (err) {
        res.status(500).send(err.message);
    }
});


// app.post('/p',async(req,res)=>{
//     try{
//         const { username,email, password, address, phone, gender, about } = req.body;
//         const user = await users.findOne({name:username});
//         // if (!user) {
//         //     return res.status(404).send('User not found');
//         // }
//         user.email = email;
//         if (password) {
//             user.pswd = await bcrypt.hash(password, 13) ;
//         }
//         user.addr = address;
//         user.phone = phone;
//         user.gender = gender;
//         user.about = about;

//         await user.save();

//         res.redirect(`/api/profile/${user.name}`);
//     } catch (err) {
//         res.status(500).send(err.message);
//     }
// });




app.post('/rtk',async(req,res)=>{
    try{
        const rf_t= req.cookies.refreshtoken ;
        if(!rf_t)
        return res.status(400).json({msg:"login now"})

        jwt.verify(rf_t, process.env.REFRESHTOKENSECRET,async(err,result)=>{
            if(err) return res.status(400).json({msg:"no"}) ;
            const check= await users.findById(result.id).select("-pswd")
            .populate("followers following") ;
            if(!check)
            return res.status(400).json({msg:"user doesn't exist"}) ;

            const ac_t=  createAccessToken({id: result.id}) ;

            res.json({
                ac_t,
                check
            })
        })
    } catch(err){
        res.status(500).json({msg:err.message}) ;
    }
});






const createAccessToken=(payload) =>{
    return jwt.sign(payload,process.env.ACCESSTOKENSECRET, {expiresIn: "1d"})
}
const createRefreshToken=(payload) =>{
    return jwt.sign(payload,process.env.REFRESHTOKENSECRET, {expiresIn: "30d"})
}


const port= 8000 ;
const localhost = '127.0.0.1' ;

app.listen(port, localhost, () => {
    console.log(`Server Listening At Port ${port}`);
});