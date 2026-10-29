const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const {
  getConversations,
  getOrCreateConversation,
  getConversationById,
  getMessages,
  sendMessage,
  markConversationAsRead,
  getUnreadCount,
  getAuthorizedDoctors,
  getAuthorizedPatients,
} = require('../controllers/chatController');

router.use(protect);

router.get('/conversations', authorizeRoles('PATIENT', 'DOCTOR', 'ADMIN'), getConversations);
router.post('/conversations', authorizeRoles('PATIENT', 'DOCTOR', 'ADMIN'), getOrCreateConversation);
router.get('/conversations/:id', authorizeRoles('PATIENT', 'DOCTOR', 'ADMIN'), getConversationById);
router.get('/conversations/:id/messages', authorizeRoles('PATIENT', 'DOCTOR', 'ADMIN'), getMessages);
router.post('/conversations/:id/messages', authorizeRoles('PATIENT', 'DOCTOR', 'ADMIN'), sendMessage);
router.patch('/conversations/:id/read', authorizeRoles('PATIENT', 'DOCTOR', 'ADMIN'), markConversationAsRead);
router.get('/unread-count', getUnreadCount);
router.get('/doctors', authorizeRoles('PATIENT', 'ADMIN'), getAuthorizedDoctors);
router.get('/patients', authorizeRoles('DOCTOR', 'ADMIN'), getAuthorizedPatients);

module.exports = router;
