const express = require('express');
const router = express.Router();
const {
    getMe,
    getUserById,
    createUser,
    getUsersInCompany,
    updateUser
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Get current user (accessible to all authenticated users)
router.get('/me', protect, getMe);

// All other routes are protected and restricted to Admins
router.use(protect);
router.use(authorize('Admin'));

router.route('/')
    .post(createUser)       // POST /api/users
    .get(getUsersInCompany); // GET /api/users

router.route('/:id')
    .get(getUserById)        // GET /api/users/:id
    .put(updateUser);        // PUT /api/users/some_user_id

module.exports = router;