const pool = require('../config/db');
const userRepo = require('../repositories/user.repository');
const profileRepo = require('../repositories/profile.repository');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');

/**
 * Register a new user.
 * Creates the user row and empty profile rows for each selected role.
 * Wraps everything in a single transaction.
 *
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.password
 * @param {string[]} params.roles - e.g. ['job_seeker'] or ['employer', 'job_seeker']
 * @returns {Promise<object>} { userId, email, roles }
 */
async function register({ email, password, roles }) {
  const emailTaken = await userRepo.emailExists(email);
  if (emailTaken) {
    const err = new Error('An account with this email already exists');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await hashPassword(password);
  const isJobSeeker = roles.includes('job_seeker');
  const isEmployer = roles.includes('employer');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const user = await userRepo.createUser({ email, passwordHash, isJobSeeker, isEmployer });

    if (isJobSeeker) {
      await profileRepo.createJobSeekerProfile(user.id);
    }
    if (isEmployer) {
      await profileRepo.createEmployerProfile(user.id);
    }

    await client.query('COMMIT');

    return { userId: user.id, email: user.email, roles };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Authenticate a user and issue a token.
 * Returns requiresRoleSelection=true for dual-role users.
 *
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.password
 * @returns {Promise<object>}
 */
async function login({ email, password }) {
  const user = await userRepo.findByEmail(email);
  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  // Build roles list
  const roles = [];
  if (user.is_super_admin) roles.push('super_admin');
  if (user.is_employer) roles.push('employer');
  if (user.is_job_seeker) roles.push('job_seeker');

  // Super admin goes straight through
  if (user.is_super_admin) {
    const token = signToken({ id: user.id, email: user.email, roles, activeRole: 'super_admin' });
    return { requiresRoleSelection: false, token, user: { id: user.id, email: user.email, roles, activeRole: 'super_admin' } };
  }

  // Dual-role: ask the client to select
  if (user.is_employer && user.is_job_seeker) {
    // Issue a limited token with no activeRole so middleware can identify them
    const token = signToken({ id: user.id, email: user.email, roles, activeRole: null });
    return { requiresRoleSelection: true, token, roles };
  }

  // Single role
  const activeRole = user.is_employer ? 'employer' : 'job_seeker';
  const token = signToken({ id: user.id, email: user.email, roles, activeRole });
  return {
    requiresRoleSelection: false,
    token,
    user: { id: user.id, email: user.email, roles, activeRole },
  };
}

/**
 * Re-issue a token with the chosen activeRole for a dual-role user.
 *
 * @param {object} currentUser - req.user from authenticate middleware
 * @param {string} role - 'employer' | 'job_seeker'
 * @returns {Promise<object>} { token, activeRole }
 */
async function selectRole(currentUser, role) {
  if (!currentUser.roles.includes(role)) {
    const err = new Error('You do not have this role');
    err.statusCode = 403;
    throw err;
  }

  const token = signToken({
    id: currentUser.id,
    email: currentUser.email,
    roles: currentUser.roles,
    activeRole: role,
  });

  return { token, activeRole: role };
}

module.exports = { register, login, selectRole };
