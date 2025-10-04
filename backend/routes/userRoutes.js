const express = require('express');
const router = express.Router();
const {
    createUser,
    getUsersInCompany,
    updateUser
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes in this file are protected and restricted to Admins.
// We apply the middleware at the router level for cleaner code.
router.use(protect);
router.use(authorize('Admin'));

router.route('/')
    .post(createUser)       // POST /api/users
    .get(getUsersInCompany); // GET /api/users

router.route('/:id')
    .put(updateUser);        // PUT /api/users/some_user_id

module.exports = router;