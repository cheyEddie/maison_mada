const {
  createReservation,
  listMyReservations,
  payReservation,
  updateReservationByOwner
} = require('../models/reservationModel');

async function create(req, res, next) {
  try {
    res.status(201).json(await createReservation(req.user, req.body));
  } catch (error) {
    next(error);
  }
}

async function mine(req, res, next) {
  try {
    res.json(await listMyReservations(req.user));
  } catch (error) {
    next(error);
  }
}

async function ownerUpdate(req, res, next) {
  try {
    const reservation = await updateReservationByOwner(req.params.id, req.user, req.body.status);
    if (!reservation) {
      res.status(404).json({ message: 'Réservation introuvable' });
      return;
    }
    res.json(reservation);
  } catch (error) {
    next(error);
  }
}

async function pay(req, res, next) {
  try {
    const reservation = await payReservation(req.params.id, req.user);
    if (!reservation) {
      res.status(404).json({ message: 'Réservation introuvable' });
      return;
    }
    res.json(reservation);
  } catch (error) {
    next(error);
  }
}

module.exports = { create, mine, ownerUpdate, pay };
