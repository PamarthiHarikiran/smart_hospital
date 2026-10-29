const express = require('express');
const router = express.Router();
const {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  recommend,
} = require('../controllers/departmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/', getDepartments);
router.post('/recommend', recommend);
router.get('/:id', getDepartmentById);

router.use(protect);

router.post('/', authorizeRoles('ADMIN'), createDepartment);
router.put('/:id', authorizeRoles('ADMIN'), updateDepartment);
router.delete('/:id', authorizeRoles('ADMIN'), deleteDepartment);

module.exports = router;
