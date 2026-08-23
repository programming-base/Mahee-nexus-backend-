const profileRepo = require('../repositories/profile.repository');
const jobService = require('../services/job.service');
const assignService = require('../services/assignment.service');
const invoiceService = require('../services/invoice.service');
const messagingService = require('../services/messaging.service');
const storageService = require('../services/storage.service');
const { success } = require('../utils/response');

async function getDashboard(req, res, next) {
  try {
    const profile = await profileRepo.findEmployerByUserId(req.user.id);

    if (!profile || !profile.company_id) {
      return success(res, { companyProfileComplete: false });
    }

    const jobs = await jobService.listEmployerJobs(req.user.id);
    const assignments = await assignService.listEmployerAssignments(req.user.id);
    const invoices = await invoiceService.listEmployerInvoices(req.user.id);

    return success(res, {
      profile,
      companyProfileComplete: true,
      stats: {
        totalJobs: jobs.length,
        approvedJobs: jobs.filter((j) => j.approval_status === 'approved').length,
        activeAssignments: assignments.filter((a) => a.status === 'active').length,
        unpaidInvoices: invoices.filter((i) => i.status === 'unpaid').length,
      },
      recentJobs: jobs.slice(0, 5),
    });
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const profile = await profileRepo.findEmployerByUserId(req.user.id);
    return success(res, profile);
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { firstName, lastName, phone, companyName, industry, description } = req.body;
    const existing = await profileRepo.findEmployerByUserId(req.user.id);

    let companyId = existing?.company_id || null;

    if (companyId) {
      await profileRepo.updateCompany(companyId, { name: companyName, industry, description });
    } else {
      const company = await profileRepo.createCompany({ name: companyName, industry, description });
      companyId = company.id;
    }

    const profile = await profileRepo.updateEmployerProfile(req.user.id, {
      firstName,
      lastName,
      phone,
      companyId,
    });

    const updated = await profileRepo.findEmployerByUserId(req.user.id);
    return success(res, updated, 'Profile updated successfully');
  } catch (err) {
    next(err);
  }
}

async function uploadLogo(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Logo file is required' });
    }

    const profile = await profileRepo.findEmployerByUserId(req.user.id);
    if (!profile || !profile.company_id) {
      return res.status(422).json({
        success: false,
        message: 'You must create a company profile before uploading a logo',
      });
    }

    const logoPath = await storageService.uploadLogo(req.file);
    await profileRepo.updateCompanyLogo(profile.company_id, logoPath);
    return success(res, { logoPath }, 'Logo uploaded successfully');
  } catch (err) {
    next(err);
  }
}

async function listJobs(req, res, next) {
  try {
    const data = await jobService.listEmployerJobs(req.user.id);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function createJob(req, res, next) {
  try {
    const job = await jobService.createJob(req.user.id, req.body);
    return success(res, job, 'Job posted and sent for admin approval', 201);
  } catch (err) {
    next(err);
  }
}

async function getJob(req, res, next) {
  try {
    const job = await jobService.getEmployerJob(Number(req.params.jobId), req.user.id);
    return success(res, job);
  } catch (err) {
    next(err);
  }
}

async function updateJob(req, res, next) {
  try {
    const job = await jobService.updateJob(Number(req.params.jobId), req.user.id, req.body);
    return success(res, job, 'Job updated successfully');
  } catch (err) {
    next(err);
  }
}

async function listAssignments(req, res, next) {
  try {
    const data = await assignService.listEmployerAssignments(req.user.id);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function listInvoices(req, res, next) {
  try {
    const data = await invoiceService.listEmployerInvoices(req.user.id);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function payInvoice(req, res, next) {
  try {
    const invoice = await invoiceService.payInvoice(Number(req.params.invoiceId), req.user.id);
    return success(res, invoice, 'Invoice marked as paid');
  } catch (err) {
    next(err);
  }
}

async function getMessages(req, res, next) {
  try {
    const data = await messagingService.getMyMessages(req.user.id);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function sendMessage(req, res, next) {
  try {
    const message = await messagingService.sendMessageToAdmin(req.user.id, req.body.message);
    return success(res, message, 'Message sent', 201);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboard,
  getProfile,
  updateProfile,
  uploadLogo,
  listJobs,
  createJob,
  getJob,
  updateJob,
  listAssignments,
  listInvoices,
  payInvoice,
  getMessages,
  sendMessage,
};
