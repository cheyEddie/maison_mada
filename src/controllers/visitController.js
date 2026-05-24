const {
  createVisitRequest,
  listMyVisits,
  payVisit,
  updateVisitByAgent
} = require('../models/visitModel');

async function create(req, res, next) {
  try {
    res.status(201).json(await createVisitRequest(req.user, req.body));
  } catch (error) {
    next(error);
  }
}

async function mine(req, res, next) {
  try {
    res.json(await listMyVisits(req.user));
  } catch (error) {
    next(error);
  }
}

async function agentUpdate(req, res, next) {
  try {
    const visit = await updateVisitByAgent(req.params.id, req.user, req.body.status);
    if (!visit) {
      res.status(404).json({ message: 'Demande de visite introuvable' });
      return;
    }
    res.json(visit);
  } catch (error) {
    next(error);
  }
}

async function pay(req, res, next) {
  try {
    const visit = await payVisit(req.params.id, req.user);
    if (!visit) {
      res.status(404).json({ message: 'Demande de visite introuvable' });
      return;
    }
    res.json(visit);
  } catch (error) {
    next(error);
  }
}

module.exports = { agentUpdate, create, mine, pay };
