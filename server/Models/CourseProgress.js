const mongoose= require('mongoose');

const courseProgress= new mongoose.Schema({
     courseID:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"SubSection",
     },
     userId: {
     type: mongoose.Schema.Types.ObjectId,
     ref: "user",
     },
     completedVideos:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"SubSection",
     }],

})


module.exports= mongoose.model('CourseProgress',courseProgress);