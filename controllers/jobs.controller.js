const jobService = require('../services/job.service');
const appService = require('../services/application.service');
const { success, successList } = require('../utils/response');

async function listJobs(req, res, next) {
  try {
    const { data, pagination } = await jobService.listPublicJobs(req.query);
    return successList(res, data, pagination);
  } catch (err) {
    next(err);
  }
}

async function getJob(req, res, next) {
  try {
    const job = await jobService.getPublicJob(Number(req.params.jobId));
    return success(res, job);
  } catch (err) {
    next(err);
  }
}

async function applyToJob(req, res, next) {
  try {
    const application = await appService.applyToJob(req.user.id, Number(req.params.jobId));
    return success(res, application, 'Application submitted successfully', 201);
  } catch (err) {
    next(err);
  }
}

async function saveJob(req, res, next) {
  try {
    const data = await appService.saveJob(req.user.id, Number(req.params.jobId));
    return success(res, data, 'Job saved');
  } catch (err) {
    next(err);
  }
}

async function unsaveJob(req, res, next) {
  try {
    const data = await appService.unsaveJob(req.user.id, Number(req.params.jobId));
    return success(res, data, 'Job removed from saved jobs');
  } catch (err) {
    next(err);
  }
}

module.exports = { listJobs, getJob, applyToJob, saveJob, unsaveJob };
