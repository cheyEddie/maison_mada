const {
  createAgentAsAdmin,
  deleteUser,
  listUsers,
  updateUserAsAdmin
} = require('../models/userModel');
const { listUserActivities, logUserActivity } = require('../models/activityModel');
const { createNotification } = require('../models/notificationModel');
const {
  deleteListingAsAdmin,
  findAdminListings,
  moderateListing,
  updateListingAsAdmin,
  updateListingFeatured
} = require('../models/listingModel');

async function usersIndex(_req, res, next) {
  try {
    res.json(await listUsers());
  } catch (error) {
    next(error);
  }
}

async function agentsStore(req, res, next) {
  try {
    const agent = await createAgentAsAdmin(req.body);
    await logUserActivity({
      userId: agent._id,
      actorId: req.user._id,
      type: 'admin.agent_create',
      label: `Creation du compte agent ${agent.reference || agent.email}`,
      metadata: { agentArrondissement: agent.agentArrondissement }
    });
    res.status(201).json(agent);
  } catch (error) {
    next(error);
  }
}

async function usersUpdate(req, res, next) {
  try {
    const user = await updateUserAsAdmin(req.params.id, req.body);
    if (!user) {
      res.status(404).json({ message: 'Utilisateur introuvable' });
      return;
    }

    const changes = [];
    if (req.body.role !== undefined) changes.push(`role ${user.role}`);
    if (req.body.accountType !== undefined) changes.push(`compte ${user.accountType}`);
    if (req.body.identityVerified !== undefined) changes.push(user.identityVerified ? 'identite verifiee' : 'identite non verifiee');
    await logUserActivity({
      userId: user._id,
      actorId: req.user._id,
      type: 'admin.user_update',
      label: `Modification admin : ${changes.join(', ') || 'compte mis a jour'}`,
      metadata: { role: user.role, accountType: user.accountType, identityVerified: user.identityVerified }
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
}

async function usersActivities(req, res, next) {
  try {
    res.json(await listUserActivities(req.params.id, req.query.limit));
  } catch (error) {
    next(error);
  }
}

async function usersNotify(req, res, next) {
  try {
    const notification = await createNotification({
      userId: req.params.id,
      actorId: req.user._id,
      type: 'admin.message',
      title: 'Message de l’administration',
      message: req.body.message,
      metadata: { source: 'admin' }
    });

    if (!notification) {
      res.status(400).json({ message: 'Message obligatoire' });
      return;
    }

    await logUserActivity({
      userId: req.params.id,
      actorId: req.user._id,
      type: 'admin.notification',
      label: 'Message admin envoye'
    });
    res.status(201).json(notification);
  } catch (error) {
    next(error);
  }
}

async function usersNotifyAll(req, res, next) {
  try {
    const message = String(req.body.message || '').trim();
    if (!message) {
      res.status(400).json({ message: 'Message obligatoire' });
      return;
    }

    const recipients = (await listUsers()).filter((user) => user.role !== 'admin');
    const notifications = await Promise.all(recipients.map((user) => createNotification({
      userId: user._id,
      actorId: req.user._id,
      type: 'admin.message',
      title: 'Message de l’administration',
      message,
      metadata: { source: 'admin', broadcast: true }
    })));
    const sentCount = notifications.filter(Boolean).length;

    await logUserActivity({
      userId: req.user._id,
      actorId: req.user._id,
      type: 'admin.notification_broadcast',
      label: `Message admin envoye a ${sentCount} utilisateurs`
    });

    res.status(201).json({ count: sentCount });
  } catch (error) {
    next(error);
  }
}

async function usersDestroy(req, res, next) {
  try {
    const result = await deleteUser(req.params.id);
    if (!result.deletedCount) {
      res.status(404).json({ message: 'Utilisateur introuvable ou administrateur protege' });
      return;
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

async function listingsIndex(req, res, next) {
  try {
    res.json(await findAdminListings(req.query));
  } catch (error) {
    next(error);
  }
}

async function listingsModerate(req, res, next) {
  try {
    const listing = await moderateListing(req.params.id, req.body.status, req.body.reason);
    if (!listing) {
      res.status(404).json({ message: 'Annonce introuvable' });
      return;
    }

    await logUserActivity({
      userId: listing.ownerId,
      actorId: req.user._id,
      type: 'admin.listing_moderation',
      label: `Moderation ${listing.status} pour ${listing.reference || listing.title}`,
      metadata: {
        listingId: String(listing._id),
        reference: listing.reference,
        title: listing.title,
        status: listing.status,
        reason: listing.moderationReason || ''
      }
    });
    if (listing.ownerId) {
      const approved = listing.status === 'approved';
      await createNotification({
        userId: listing.ownerId,
        actorId: req.user._id,
        type: approved ? 'listing.approved' : 'listing.rejected',
        title: approved ? 'Publication acceptée' : 'Publication refusée',
        message: approved
          ? `Votre annonce "${listing.title}" a été acceptée.`
          : `Votre annonce "${listing.title}" a été refusée.${listing.moderationReason ? ` Raison : ${listing.moderationReason}` : ''}`,
        metadata: {
          listingId: String(listing._id),
          reference: listing.reference,
          title: listing.title,
          status: listing.status,
          reason: listing.moderationReason || ''
        }
      });
    }
    res.json(listing);
  } catch (error) {
    next(error);
  }
}

async function listingsFeatured(req, res, next) {
  try {
    const listing = await updateListingFeatured(req.params.id, req.body.featured);
    if (!listing) {
      res.status(404).json({ message: 'Annonce introuvable' });
      return;
    }

    await logUserActivity({
      userId: listing.ownerId,
      actorId: req.user._id,
      type: 'admin.listing_featured',
      label: `${listing.featured ? 'Mise a la une' : 'Retrait de la une'} : ${listing.reference || listing.title}`,
      metadata: { listingId: String(listing._id), reference: listing.reference, title: listing.title, featured: listing.featured }
    });
    res.json(listing);
  } catch (error) {
    next(error);
  }
}

async function listingsUpdate(req, res, next) {
  try {
    const listing = await updateListingAsAdmin(req.params.id, req.user, req.body, req.files || []);
    if (!listing) {
      res.status(404).json({ message: 'Annonce introuvable' });
      return;
    }

    await logUserActivity({
      userId: listing.ownerId,
      actorId: req.user._id,
      type: 'admin.listing_update',
      label: `Modification admin de ${listing.reference || listing.title}`,
      metadata: { listingId: String(listing._id), reference: listing.reference, title: listing.title }
    });
    res.json(listing);
  } catch (error) {
    next(error);
  }
}

async function listingsDestroy(req, res, next) {
  try {
    const listing = (await findAdminListings({ limit: 100 }))
      .find((item) => String(item._id) === String(req.params.id));
    const result = await deleteListingAsAdmin(req.params.id);
    if (!result.deletedCount) {
      res.status(404).json({ message: 'Annonce introuvable' });
      return;
    }

    if (listing?.ownerId) {
      await logUserActivity({
        userId: listing.ownerId,
        actorId: req.user._id,
        type: 'admin.listing_delete',
        label: `Suppression admin de ${listing.reference || listing.title}`,
        metadata: { listingId: req.params.id, reference: listing.reference, title: listing.title }
      });
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  agentsStore,
  listingsDestroy,
  listingsFeatured,
  listingsIndex,
  listingsModerate,
  listingsUpdate,
  usersDestroy,
  usersActivities,
  usersIndex,
  usersNotify,
  usersNotifyAll,
  usersUpdate
};
