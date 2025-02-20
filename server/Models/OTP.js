const mongoose= require('mongoose');
const mailSender = require('../Utils/mailSender');
const emailTemplate = require("../mail/templates/emailVerificationTemplate");

const OTPSchema= new mongoose.Schema({
     email:{
        type:String,
        required:true
     }, 

     otp:{
        type:String,
        required:true
     }, 

     createdAt:{
        type:Date,
        default:Date.now(),
        expires:60*5,
     }, 
    
})

async function sendVerificationEmail(email,otp){
    try{
      const mailResponse = await mailSender(email, "Verification email from CodeSphere", emailTemplate(otp)) ;
    
    }catch(error){
        console.log(error);
        throw error;
    }
}

OTPSchema.pre("save", async function(next){
    await sendVerificationEmail(this.email, this.otp);
    next();
})

module.exports= mongoose.model('OTP',OTPSchema);