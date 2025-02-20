const express = require("express")
const router = express.Router()


const { login, signup, sendOTP, changePassword} = require("../Controllers/Auth");
const {resetPasswordToken, resetPassword} = require("../Controllers/ResetPassword")
const { auth } = require("../Middleware/auth")




router.post("/login", login)
router.post("/signup", signup)
router.post("/sendotp", sendOTP)
router.post("/changepassword", auth, changePassword)


router.post("/reset-password-token", resetPasswordToken)
router.post("/reset-password", resetPassword)

module.exports = router