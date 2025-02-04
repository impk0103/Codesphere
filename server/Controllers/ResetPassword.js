const User= require('../Models/User');
const mailSender = require('../Utils/mailSender');
const bcrypt =require('bcryptjs');

exports.resetPasswordToken = async(req,res) =>{
    try{
       const {email} =req.body;
       const user =await User.findOne({email:email});

       if(!user){
          return res.status(403).json({
            success:false,
            message:'User does not exist , signup first'
          })
       }  

       const token= crypto.randomUUID();
       const updatedDetails = await User.findOneAndUpdate({email:email},
                                                  {
                                                    token:token,
                                                    resetPasswordExpires:Date.now() + 3600000,
                                                  },
                                                  {new:true});
       const url= `https://codesphere-rho.vercel.app/update-password/${token}`;
       await mailSender(email,"Password reset Link",`Password Reset Link: ${url}`)

       return res.status(200).json({
        success:true,
        message:"Email Sent successfully"
       })

    }catch(error){
            console.log(error);
            return res.status(500).json({
                success:false,
                message:"Something went wrong while sending email"
               }) 
    }
}


exports.resetPassword= async(req,res)=>
{
    try{
            const {password,confirmPassword,token}=req.body;
            if(password!==confirmPassword)
            {
                return res.status(400).json({
                  success:false,
                  message:"Password & Confirm Password didn't matched, try again"
                })
            }
            const userDetails = await User.findOne({token:token});
            if(!userDetails){
              return res.json({
                success: false,
                message:"Token invalid"
              })
            }  
            if(userDetails.resetPasswordExpires< Date.now())
            {
              return res.json({
                success: false,
                message:"Token is expired, regenerate token"
              }) 
            }

              const hashPass= await bcrypt.hash(password,10);

              await User.findOneAndUpdate(
                {token:token},
                { password:hashPass},
                {new:true}
              )

              return res.status(200).json({
                success:true,
                message:"Password updated successfully",
              })
    }catch(error){

        console.log(error);
         return res.status(500).json({
          success:false,
          message:"Something went wrong while updating password"
         }) 

    }



}
