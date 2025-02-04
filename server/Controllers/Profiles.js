const Profile = require('../Models/Profile');
const User = require('../Models/User');
const Course = require("../Models/Course");
const CourseProgress = require("../Models/CourseProgress");
const { uploadImgToCloudinary } = require("../Utils/imageUploader");
const { convertSecondsToDuration } = require("../Utils/secToDuration");

exports.updateProfile =async (req, res) =>{
    try{
        const {gender, dateOfBirth="", about="", contactNumber}=req.body;
        const userId =req.user.id;
       
        
        if(!userId || !gender || !contactNumber|| !dateOfBirth|| !about){
            return res.status(400).json({
                success:false,
                message:"All fields are mandatory"
            }) 
        }
        const userDetails = await User.findById(userId);
        const profileId = userDetails.additionalDetails;
    
        const updatedProfile = await Profile.findByIdAndUpdate(profileId,
            {
                gender:gender,
                dateOfBirth:dateOfBirth,
                about:about,
                contactNumber:contactNumber
            },
            {new:true}
        )
        userDetails.additionalDetails=updatedProfile;
        return res.status(200).json({
            success:true,
            message:"Profile updated successfully",
            data:userDetails,
        })

    }catch(error){
        return res.status(500).json({
            success:false, 
            message:"Unable to update profile",
            error:error.message
        })
    }
}

exports.deleteAccount= async(req,res)=>{
    try{
       const userId= req.user.id;
    
       const userDetails = await User.findById(userId);
       if(!userDetails){
        return res.status(400).json({
            success:false, 
            message:"User not exists",
        })
       }
       const profileId = userDetails.additionalDetails;
   
       await Profile.findByIdAndDelete(profileId);
       await User.findByIdAndDelete(userId);
       return res.status(200).json({
        success:true,
        message:"User Account Deleted successfully" 
    })
    }catch(error){
        return res.status(500).json({
            success:false, 
            message:"Unable to delete account",
            error:error.message
        })
    }
}


exports.getAllUserDetails =async (req,res)=>{
    try{
        const userId= req.user.id;
   
        const userDetails = await User.findById(userId).populate("additionalDetails").exec();
       
        return res.status(200).json({
            success:true,
            message:"User Detail fetched successfully", 
            data:userDetails,
        })
    }catch(error){
        return res.status(500).json({
            success:false, 
            message:"Unable to fetch account details",
            error:error.message
        })
    }
}


exports.updateDisplayPicture = async (req, res) => {
    try {
      const displayPicture = req.files.displayPicture
      const userId = req.user.id
      
      const image = await uploadImgToCloudinary(
        displayPicture,
        process.env.FOLDER_NAME,
        1000,
        1000
      )
    
      const updatedProfile = await User.findByIdAndUpdate(
        { _id: userId },
        { image: image.secure_url },
        { new: true }
      )
      res.send({
        success: true,
        message: `Image Updated successfully`,
        data: updatedProfile,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
};
  
exports.getEnrolledCourses = async (req, res) => {
  try {
	  const userId = req.user.id
	  let userDetails = await User.findOne({
		_id: userId,
	  })
		.populate({
		  path: "courses",
		  populate: {
			path: "courseContent",
			populate: {
			  path: "subSection",
			},
		  },
		})
		.exec()

	  userDetails = userDetails.toObject()
	  var SubsectionLength = 0
	  for (var i = 0; i < userDetails.courses.length; i++) {
		let totalDurationInSeconds = 0
		SubsectionLength = 0
		for (var j = 0; j < userDetails.courses[i].courseContent.length; j++) {
		  totalDurationInSeconds += userDetails.courses[i].courseContent[
			j
		  ].subSection.reduce((acc, curr) => acc + parseInt(curr.timeDuration), 0)
		  userDetails.courses[i].totalDuration = convertSecondsToDuration(
			totalDurationInSeconds
		  )
		  SubsectionLength +=
			userDetails.courses[i].courseContent[j].subSection.length
		}
		let courseProgressCount = await CourseProgress.findOne({
		  courseID: userDetails.courses[i]._id,
		  userId: userId,
		})
		courseProgressCount = courseProgressCount?.completedVideos.length
		if (SubsectionLength === 0) {
		  userDetails.courses[i].progressPercentage = 100
		} else {
		  // To make it up to 2 decimal point
		  const multiplier = Math.pow(10, 2)
		  userDetails.courses[i].progressPercentage =
			Math.round(
			  (courseProgressCount / SubsectionLength) * 100 * multiplier
			) / multiplier
		}
	  }
  
	  if (!userDetails) {
		return res.status(400).json({
		  success: false,
		  message: `Could not find user with id: ${userDetails}`,
		})
	  }
	  return res.status(200).json({
		success: true,
		data: userDetails.courses,
	  })
	} catch (error) {
	  return res.status(500).json({
		success: false,
		message: error.message,
	  })
	}
};

exports.instructorDashboard = async(req, res) => {
	try{
		const courseDetails = await Course.find({instructor:req.user.id});

		const courseData  = courseDetails.map((course)=> {
			const totalStudentsEnrolled = course.studentsEnrolled.length
			const totalAmountGenerated = totalStudentsEnrolled * course.price

			//create an new object with the additional fields
			const courseDataWithStats = {
				_id: course._id,
				courseName: course.courseName,
				courseDescription: course.courseDescription,
				totalStudentsEnrolled,
				totalAmountGenerated,
			}
			return courseDataWithStats
		})

		res.status(200).json({courses:courseData});

	}
	catch(error) {
		console.error(error);
		res.status(500).json({message:"Internal Server Error"});
	}
}