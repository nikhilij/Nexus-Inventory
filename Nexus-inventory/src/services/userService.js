/**
 * User Service
 * Provides functions to manage users in the Nexus Inventory system.
 */

const users = []; // In-memory user store (replace with DB in production)

/**
 * Create a new user.
 * @param {Object} userData - { username, email, password }
 * @returns {Object} Created user object
 */
function createUser(userData) {
    const user = {
        id: users.length + 1,
        username: userData.username,
        email: userData.email,
        password: userData.password, // Hash in production!
        createdAt: new Date(),
    };
    users.push(user);
    return user;
}

/**
 * Find a user by username.
 * @param {string} username
 * @returns {Object|null} User object or null
 */
function findUserByUsername(username) {
    return users.find(u => u.username === username) || null;
}

/**
 * List all users.
 * @returns {Array} Array of user objects
 */
function listUsers() {
    return [...users];
}

module.exports = {
    createUser,
    findUserByUsername,
    listUsers,
};