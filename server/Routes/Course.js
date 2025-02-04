// Import the required modules
const express = require("express")
const router = express.Router()


const {createCourse, showAllCourses, getCourseDetail, getFullCourseDetails, editCourse ,getInstructorCourses, deleteCourse} = require("../Controllers/Courses")
const {showAllcategory, createCategory, categoryPageDetails} = require("../Controllers/Categorys")
const {createSection, updateSection, deleteSection} = require("../Controllers/Sections")
const {createSubSection, updateSubSection, deleteSubSection} = require("../Controllers/SubSections")
const {createRating, getAverageRating, getAllRating} = require("../Controllers/RatingAndReviews")
const { auth, isInstructor, isStudent, isAdmin } = require("../Middleware/auth")
const { updateCourseProgress } = require("../Controllers/courseProgress")




router.post("/createCourse", auth, isInstructor, createCourse)
router.post("/addSection", auth, isInstructor, createSection)
router.post("/updateSection", auth, isInstructor, updateSection)
router.post("/deleteSection", auth, isInstructor, deleteSection)
router.post("/updateSubSection", auth, isInstructor, updateSubSection)
router.post("/deleteSubSection", auth, isInstructor, deleteSubSection)
router.post("/addSubSection", auth, isInstructor, createSubSection)
router.get("/getAllCourses", showAllCourses)
router.post("/getCourseDetails", getCourseDetail)
router.post("/getFullCourseDetails", auth, getFullCourseDetails)
router.post("/editCourse", auth, isInstructor, editCourse)
router.get("/getInstructorCourses", auth, isInstructor, getInstructorCourses)
router.delete("/deleteCourse", deleteCourse)


router.post("/updateCourseProgress", auth, isStudent, updateCourseProgress);

router.post("/createCategory", auth, isAdmin, createCategory)
router.get("/showAllCategories", showAllcategory)
router.post("/getCategoryPageDetails", categoryPageDetails)


router.post("/createRating", auth, isStudent, createRating)
router.get("/getAverageRating", getAverageRating)
router.get("/getReviews", getAllRating)

module.exports = router