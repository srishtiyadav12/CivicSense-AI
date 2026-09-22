const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

/**
 * @route GET /api/users
 * @desc List all users (admin only)
 */
router.get('/', authorize('admin', 'super_admin'), asyncHandler(async (req, res) => {
  const { role, department, search, page = 1, limit = 20 } = req.query;
  const where = {};

  if (role) where.role = role;
  if (department) where.department = department;
  if (search) {
    const term = `%${search}%`;
    where[Op.or] = [
      { name: { [Op.like]: term } },
      { email: { [Op.like]: term } }
    ];
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
    attributes: { exclude: ['password'] }
  });

  res.status(200).json({
    success: true,
    users: rows.map(u => u.toJSON()),
    pagination: { page: parseInt(page), limit: parseInt(limit), total: count, pages: Math.ceil(count / parseInt(limit)) }
  });
}));

/**
 * @route GET /api/users/officials
 * @desc Get all officials for assignment dropdowns
 */
router.get('/officials', authorize('official', 'admin', 'super_admin'), asyncHandler(async (req, res) => {
  const where = { role: 'official', isActive: true };
  if (req.user.role === 'official') where.department = req.user.department;

  const officials = await User.findAll({
    where,
    attributes: ['id', 'name', 'email', 'department', 'role']
  });

  res.status(200).json({ success: true, officials: officials.map(o => o.toJSON()) });
}));

/**
 * @route PATCH /api/users/:id
 * @desc Update user (role, department, active status)
 */
router.patch('/:id', authorize('admin', 'super_admin'), asyncHandler(async (req, res) => {
  const { role, department, isActive } = req.body;
  const user = await User.findByPk(req.params.id);

  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const updates = {};
  if (role) updates.role = role;
  if (department) updates.department = department;
  if (isActive !== undefined) updates.isActive = isActive;

  await user.update(updates);

  res.status(200).json({ success: true, user: user.toJSON() });
}));

module.exports = router;