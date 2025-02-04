const SubSection = require('../Models/SubSection');
const Section = require('../Models/Section');
const {uploadImgToCloudinary}= require('../Utils/imageUploader');


exports.createSubSection =async(req,res)=>{
    try{
         const {sectionId ,title, description}= req.body;

         const video=req.files.video;

         if(!sectionId || !title || !description || !video){
            return res.status(400).json({
                success:false,
                message:"All fields are mandatory"
            }) 
         }
         const uploadDetails = await uploadImgToCloudinary(video,process.env.FOLDER_NAME)

         const newSubSection =await SubSection.create(
            {
                title:title,
                timeDuration: `${uploadDetails.duration}`,
                description:description,
                videoUrl:uploadDetails.secure_url,
 
            }
         )

         const updatedSection = await Section.findByIdAndUpdate(
          { _id: sectionId },
            {
                $push:{
                    subSection:newSubSection._id,
                }
            },
            {new:true},
         ).populate("subSection");

         return res.status(200).json({
            success:true,
            message:"SubSection created successfully",
            data:updatedSection,
        })
    }catch(error){
        return res.status(500).json({
            success:false, 
            message:"Internal server error",
            error:error.message
        })
    }
}


exports.updateSubSection = async (req, res) => {
    try {
      const {sectionId, subSectionId, title, description , timeDuration} = req.body;

      const subSection = await SubSection.findById(subSectionId)
  
      if (!subSection) {
        return res.status(404).json({
          success: false,
          message: "SubSection not found",
        })
      }
  
      if (title !== undefined) {
        subSection.title = title
      }
  
      if (description !== undefined) {
        subSection.description = description
      }

      if (req.files && req.files.videoFile !== undefined) {
        const video = req.files.videoFile
        const uploadDetails = await uploadImgToCloudinary(
          video,
          process.env.FOLDER_NAME
        )
        subSection.videoUrl = uploadDetails.secure_url
        subSection.timeDuration = `${uploadDetails.duration}`
      }

      if (timeDuration !== undefined) {
        subSection.timeDuration = timeDuration
      }
  
      await subSection.save()

      const updatedSection = await Section.findById(subSectionId).populate("subSection")
  
      return res.json({
        success: true,
        data:updatedSection,
        message: "Section updated successfully",
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: "An error occurred while updating the section",
      })
    }
  }


  exports.deleteSubSection = async (req, res) => {
    try {
      const { subSectionId, sectionId } = req.body
      await Section.findByIdAndUpdate(
        { _id: sectionId },
        {
          $pull: {
            subSection: subSectionId,
          },
        }
      )
      const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId })
  
      if (!subSection) {
        return res
          .status(404)
          .json({ success: false, message: "SubSection not found" })
      }

      const updatedSection = await Section.findById(sectionId).populate("subSection")
  
      return res.json({
        success: true,
        data:updatedSection,
        message: "SubSection deleted successfully",
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: "An error occurred while deleting the SubSection",
      })
    }
  }