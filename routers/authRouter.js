const users= require("../models/userModel") ;
const bcrypt= require('bcrypt') ;
const jwt= require('jsonwebtoken') ;
const router= require('express').Router() ;




router.post('/signup',async(req,res)=>{
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




router.post('/signout',async(req,res)=>{
    try{
        res.clearCookie('refreshtoken', {path:'/api/rtk'})
        res.json({msg:'logged out'}) ;
    } catch(err){
        res.status(500).json({msg:err.message}) ;
    }
});


router.post('/profile',async(req,res)=>{
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


// router.post('/p',async(req,res)=>{
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




router.post('/rtk',async(req,res)=>{
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

module.exports= router ;