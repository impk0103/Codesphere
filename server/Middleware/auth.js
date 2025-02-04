const jwt = require('jsonwebtoken');
require('dotenv').config();
const User =require("../Models/User")

exports.auth=(req,res,next)=>{
    try{
  
     
      const token=req.cookies.token || req.body.token || req.header("Authorization").replace("Bearer ","");
      if(!token){
         res.status(401).json({
             success:false,
             message:"Token missing"
         }) 
      }
 
      try{
         const decode= jwt.verify(token, process.env.JWT_SECRET);
        
         req.user=decode;
      }catch(error){
         res.status(401).json({
             success:false,
             message:'Token is invalid'  
         })
      }
      next();
    }catch(error)
    {
       return res.status(401).json({
          success:false,
          message:'something went wrong'
       })
    }
} 

exports.isStudent= (req,res,next)=>{
    try{
      if(req.user.accountType!=='Student')
      {
        return res.status(401).json({
            success:false,
            message:'This is a protected route for Student'
        })
      }
      next();
    }catch(error)
    {
        return res.status(401).json({
            success:false,
            message:"User accountType cannot be verified, internal server error"
        })   
    }
}

exports.isInstructor= (req,res,next)=>{
    try{
      if(req.user.accountType!=='Instructor')
      {
        return res.status(401).json({
            success:false,
            message:'This is a protected route for Instructor'
        })
      }
      next();
    }catch(error)
    {
        return res.status(401).json({
            success:false,
            message:"User accountType cannot be verified, internal server error"
        })   
    }
}

exports.isAdmin= (req,res,next)=>{
    try{
      if(req.user.accountType!=='Admin')
      {
        return res.status(401).json({
            success:false,
            message:'This is a protected route for Admin'
        })
      }
      next();
    }catch(error)
    {
        return res.status(401).json({
            success:false,
            message:"User accountType cannot be verified, internal server error"
        })   
    }
}


