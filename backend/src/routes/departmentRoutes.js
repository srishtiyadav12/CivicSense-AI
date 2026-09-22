const express = require('express');
const router = express.Router();
const { Department, User } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

/**
 * @route GET /api/departments
 * @desc List departments
 */
router.get('/', asyncHandler(async (req, res) => {
  const departments = await Department.findAll({
    where: { isActive: true },
    include: [{ model: User, as: 'headOfDepartment', attributes: ['id', 'name', 'email'] }]
  });
  res.status(200).json({ success: true, departments: departments.map(d => d.toJSON()) });
}));

/**
 * @route POST /api/departments
 * @desc Create department (admin only)
 */
router.post('/', authorize('admin', 'super_admin'), asyncHandler(async (req, res) => {
  const department = await Department.create({
    ...req.body,
    assignedWards: JSON.stringify(req.body.assignedWards || [])
  });
  res.status(201).json({ success: true, department: department.toJSON() });
}));

/**
 * @route PATCH /api/departments/:id
 * @desc Update department (admin only)
 */
router.patch('/:id', authorize('admin', 'super_admin'), asyncHandler(async (req, res) => {
  const department = await Department.findByPk(req.params.id);
  if (!department) return res.status(404).json({ success: false, message: 'Department not found' });

  const updates = { ...req.body };
  if (updates.assignedWards) updates.assignedWards = JSON.stringify(updates.assignedWards);
  delete updates.id;

  await department.update(updates);
  res.status(200).json({ success: true, department: department.toJSON() });
}));

/**
 * @route GET /api/departments/catalogue
 * @desc Get the standard department catalogue
 */
router.get('/catalogue', asyncHandler(async (req, res) => {
  const { DEPARTMENTS } = require('../config/constants');
  const uniqueDepartments = [...new Set(Object.values(DEPARTMENTS))];
  res.status(200).json({ success: true, departments: uniqueDepartments });
}));

module.exports = router;