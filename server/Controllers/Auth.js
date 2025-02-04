const User =require("../Models/User");
const OTP = require('../Models/OTP');
const otpGenerator =require('otp-generator');
const bcrypt= require('bcryptjs');
const Profile =require('../Models/Profile');
const jwt = require('jsonwebtoken');
const mailSender = require("../Utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
require('dotenv').config()



exports.sendOTP = async (req,res) =>{
      try{
        const {email}= req.body;
        const checkUserPresent = await User.findOne({email});
  
        if(checkUserPresent)
        {
          return res.status(401).json({
              success:false,
              message:"User already registered",
          })
        } 
        
        var otp =otpGenerator.generate(6,{
            upperCaseAlphabets: false,
            lowerCaseAlphabets:false,
            specialChars:false,
        })

        

        let result= await OTP.findOne({otp:otp});
        
        while(result)
        {
            otp=otpGenerator.generate(6,{
                upperCaseAlphabets: false,
                lowerCaseAlphabets:false,
                specialChars:false,
            })

            result= await OTP.findOne({otp:otp})
        }    

        const otpPayload ={email,otp};

        const otpBody = await OTP.create(otpPayload);
       

        res.status(200).json({
            success:true,
            message:"OTP Sent Successfully",
            otp,
        })    
      }catch(error){
         console.log(error);
         return res.status(500).json({
            success:false,
            message:error.message,
         })
      }
}


exports.signup =async(req, res) =>{
    try{
      const {
        firstName,
        lastName,
        email,
        contactNumber,
        password,
        confirmPassword,
        accountType,
        otp
    }= req.body;
 
    if(!firstName || !lastName || !email || !password || !confirmPassword || !otp)
    {
        return res.status(403).json({
            success:false,
            message:"All fields are required"
         })
    }    

      if(password!==confirmPassword)
      {
         return res.status(400).json({
            success:false,
            message:"Password & Confirm Password didn't matched, try again"
         })
      }  

    
      const existingUser = await User.findOne({email});
      if(existingUser)
      {
        return res.status(400).json({
            success:false,
            message: "User is already registered",
        });
      }


       const recentOtp = await OTP.find({email}).sort({createdAt:-1}).limit(1);
       
       if(recentOtp.length===0)
       {
          return res.status(400).json({
            success:false,
            message:"Otp not Found",
          })
       }
       else if(otp!==recentOtp[0].otp){
         return res.status(400).json({
            success:false,
            message:"Invalid OTPs"
         })
       }

    
    const hashedPassword= await bcrypt.hash(password,10);

    let approved = "";
    approved === "Instructor" ? (approved = false) : (approved = true);
     
    const profileDetails = await Profile.create({
        gender:null,
        dateOfBirth:null,
        about:null,
        contactNumber:null,
    })

     const user= await User.create(
        {
            firstName,
            lastName,
            email,
            contactNumber,
            password:hashedPassword,
            accountType,
            approved:approved,
            additionalDetails: profileDetails._id,
            image: `http://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
            // otp
        })

      return res.status(200).json({
        success:true,
        message:"User created successfully",
      });
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:'Server Error:User cannot be registered , please try again later'
        })
    }
}


exports.login =async(req, res) =>{
    try{
       const {email , password}= req.body;

       if(!email || !password)
       {
           return res.status(403).json({
              success:false,
              message:"Email or Password can't be vacant",
           })
       }

       const user =await User.findOne({email}).populate("additionalDetails");
       if(!user)
       {
           return res.status(401).json({
               success:false,
               message:"user not exist , Signup first"
           })
       }


       if(await bcrypt.compare(password,user.password))
       {

        const payload ={
            email:user.email,
            id:user._id,
            accountType:user.accountType,
         };

         const token = jwt.sign(payload, 
                                process.env.JWT_SECRET,
                                {
                                    expiresIn:"2h",
                                });
                            
          user.token = token;
          user.password = undefined;

          const options ={
            expires: new Date(Date.now() + 3*24*60*60*1000),
            httpOnly:true,
          }
          res.cookie("token" ,token, options).status(200).json({
            success:true,
            token,
            user,
            message:"user logged in succesfully"
          })

       }
       else
       {
          return res.status(402).json({
             success:false,
             message:"Password is incorrect",
          })
       }
    } 
    catch(err)
    {
        console.log(err);
        return res.status(500).json({
           success:false,
           message:'Login Failure',
        })
    }
}

exports.changePassword= async(req,res)=>{
    try{
        
        const {UserId}= req.user.id;
        const {oldPassword, newPassword} =req.body;
        const userDetails = await User.findOne({UserId});
        
        if(!oldPassword || !newPassword ){
            return res.status(403).json({
                success:false,
                message:'All fields are required'
            })
        }
        const isPasswordMatch = await bcrypt.compare(
			oldPassword,
			userDetails.password
		);
        if(!isPasswordMatch)
        {
            return res.status(400).json({
                success:false,
                message:"Old Password didn't matched, try again"
            }) 
        }   

        const encryptedPassword = await bcrypt.hash(newPassword, 10);
		const updatedUserDetails = await User.findOneAndUpdate(
			{UserId},
			{ password: encryptedPassword },
			{ new: true }
		);

        


        try {
			const emailResponse = await mailSender(
				updatedUserDetails.email,
                `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`,
				passwordUpdated(
					updatedUserDetails.email,
					`${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`,
				)
			);
			
		} catch (error) {
			
			console.log(error);
			return res.status(500).json({
				success: false,
				message: "Error occurred while sending email",
				error: error.message,
			});
		}

        return res.status(200).json({ 
            success: true, 
            message: "Password updated successfully" ,
        });



    }catch(error){
       console.log(error);
       return res.status(500).json({
        success:false,
        message:"Error encountered while changing Password , try again later",
       })
    }
}