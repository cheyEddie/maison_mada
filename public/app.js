const state = {
  user: null,
  token: localStorage.getItem('maisonMadaToken') || '',
  authMode: 'login',
  favorites: new Set(JSON.parse(localStorage.getItem('maisonMadaFavorites') || '[]')),
  afterAuth: null,
  dashboardFilter: 'all',
  adminTab: 'listings',
  adminView: 'table',
  memberListingsData: [],
  notificationsData: [],
  adminListingsData: [],
  adminUsersData: [],
  listingsData: [],
  otherListingsData: [],
  recentListingsData: [],
  profileListingsData: [],
  chatConversations: [],
  chatMessages: [],
  unreadChatConversations: new Set(),
  activeConversationId: '',
  chatQuickFilter: 'all',
  socket: null,
  editingListingId: null,
  lang: localStorage.getItem('maisonMadaLang') || 'fr'
};

const els = {
  listings: document.querySelector('#listingsGrid'),
  otherListings: document.querySelector('#otherListingsGrid'),
  recent: document.querySelector('#recentListings'),
  profilePage: document.querySelector('#profilePage'),
  profilePageContent: document.querySelector('#profilePageContent'),
  profileBackButton: document.querySelector('#profileBackButton'),
  stats: document.querySelector('#statsGrid'),
  search: document.querySelector('#search'),
  authModal: document.querySelector('#authModal'),
  authForm: document.querySelector('#authForm'),
  authTitle: document.querySelector('#authTitle'),
  authNote: document.querySelector('#authNote'),
  authSubmit: document.querySelector('#authSubmit'),
  authStatus: document.querySelector('#authStatus'),
  publishModal: document.querySelector('#publishModal'),
  publishForm: document.querySelector('#publishForm'),
  publishStatus: document.querySelector('#publishStatus'),
  editModal: document.querySelector('#editModal'),
  editForm: document.querySelector('#editForm'),
  editStatus: document.querySelector('#editStatus'),
  verificationModal: document.querySelector('#verificationModal'),
  verificationForm: document.querySelector('#verificationForm'),
  verificationStatus: document.querySelector('#verificationStatus'),
  mapModal: document.querySelector('#mapModal'),
  mapFrame: document.querySelector('#mapFrame'),
  mapTitle: document.querySelector('#mapTitle'),
  mapExternalLink: document.querySelector('#mapExternalLink'),
  detailModal: document.querySelector('#detailModal'),
  detailTitle: document.querySelector('#detailTitle'),
  detailReference: document.querySelector('#detailReference'),
  detailContent: document.querySelector('#detailContent'),
  adminModal: document.querySelector('#adminModal'),
  adminStats: document.querySelector('#adminStats'),
  adminSectionTitle: document.querySelector('#adminSectionTitle'),
  adminListings: document.querySelector('#adminListings'),
  adminUsers: document.querySelector('#adminUsers'),
  adminActivityPanel: document.querySelector('#adminActivityPanel'),
  adminActivityUser: document.querySelector('#adminActivityUser'),
  adminActivityList: document.querySelector('#adminActivityList'),
  adminProfilePanel: document.querySelector('#adminProfilePanel'),
  adminProfileSubtitle: document.querySelector('#adminProfileSubtitle'),
  adminProfileContent: document.querySelector('#adminProfileContent'),
  memberModal: document.querySelector('#memberModal'),
  memberIdentity: document.querySelector('#memberIdentity'),
  memberListings: document.querySelector('#memberListings'),
  memberNotificationsPanel: document.querySelector('#memberNotificationsPanel'),
  memberNotifications: document.querySelector('#memberNotifications'),
  memberProfilePanel: document.querySelector('#memberProfilePanel'),
  memberProfileSubtitle: document.querySelector('#memberProfileSubtitle'),
  memberProfileContent: document.querySelector('#memberProfileContent'),
  dashboardStats: document.querySelector('#dashboardStats'),
  langToggle: document.querySelector('#langToggle'),
  menuToggle: document.querySelector('#menuToggle'),
  langFlag: document.querySelector('#langFlag'),
  langCode: document.querySelector('#langCode'),
  themeToggle: document.querySelector('#themeToggle'),
  notificationsOpenButton: document.querySelector('#notificationsOpenButton'),
  notificationsQuickPanel: document.querySelector('#notificationsQuickPanel'),
  notificationsQuickClose: document.querySelector('#notificationsQuickClose'),
  notificationsQuickList: document.querySelector('#notificationsQuickList'),
  notificationsQuickAll: document.querySelector('#notificationsQuickAll'),
  chatOpenButton: document.querySelector('#chatOpenButton'),
  chatQuickPanel: document.querySelector('#chatQuickPanel'),
  chatQuickClose: document.querySelector('#chatQuickClose'),
  chatQuickSearch: document.querySelector('#chatQuickSearch'),
  chatQuickAll: document.querySelector('#chatQuickAll'),
  chatQuickList: document.querySelector('#chatQuickList'),
  chatDrawer: document.querySelector('#chatDrawer'),
  chatCloseButton: document.querySelector('#chatCloseButton'),
  supportChatButton: document.querySelector('#supportChatButton'),
  chatRefreshButton: document.querySelector('#chatRefreshButton'),
  chatConversations: document.querySelector('#chatConversations'),
  chatThreadTitle: document.querySelector('#chatThreadTitle'),
  chatConnectionStatus: document.querySelector('#chatConnectionStatus'),
  chatMessages: document.querySelector('#chatMessages'),
  chatForm: document.querySelector('#chatForm'),
  toast: document.querySelector('#toast')
};

const stats = [
  ['location', 'common.location', 'home'],
  ['vente', 'common.sale', 'badge-dollar-sign']
];

const languages = {
  fr: { code: 'FR', flag: '🇫🇷', htmlLang: 'fr' },
  mg: { code: 'MG', flag: '🇲🇬', htmlLang: 'mg' },
  en: { code: 'EN', flag: '🇬🇧', htmlLang: 'en' }
};

const languageOrder = ['fr', 'mg', 'en'];

if (!languages[state.lang]) state.lang = 'fr';

const i18n = {
  fr: {
    'nav.home': 'Accueil',
    'nav.search': 'Rechercher',
    'nav.listings': 'Annonces',
    'nav.myListings': 'Mes annonces',
    'nav.admin': 'Admin',
    'nav.favorites': 'Favoris',
    'chat.title': 'Messages',
    'chat.subtitle': 'Discutez avec les annonceurs ou le support.',
    'chat.support': 'Support client',
    'chat.refresh': 'Actualiser',
    'chat.pickConversation': 'Choisissez une conversation',
    'chat.placeholder': 'Votre message',
    'chat.send': 'Envoyer',
    'chat.noConversation': 'Aucune conversation',
    'chat.openDirect': 'Discuter',
    'chat.supportLabel': 'Support client',
    'chat.directLabel': 'Conversation client',
    'chat.connected': 'Connecté',
    'chat.offline': 'Hors ligne',
    'chat.newMessage': 'Nouveau message',
    'verify.title': 'Vérifier mon compte',
    'verify.note': 'Envoyez une pièce d’identité ou un justificatif pour que le support valide votre compte.',
    'verify.fullName': 'Nom complet',
    'verify.documentType': 'Type de document',
    'verify.other': 'Autre',
    'verify.documents': 'Documents',
    'verify.message': 'Message',
    'verify.submit': 'Envoyer',
    'verify.open': 'Demander la vérification',
    'verify.pending': 'Demande envoyée',
    'verify.sent': 'Demande de vérification envoyée',
    'verify.status': 'Statut de vérification',
    'hero.title': 'Trouvez la maison qui vous correspond',
    'hero.subtitle': 'Maisons à louer, biens à vendre et terrains partout à Madagascar.',
    'search.query': 'Recherche',
    'search.placeholder': 'Ville, quartier, type de bien',
    'search.deal': 'Annonce',
    'search.property': 'Bien',
    'search.maxPrice': 'Prix max',
    'common.all': 'Tous',
    'common.allPlural': 'Toutes',
    'common.location': 'Location',
    'common.locations': 'Locations',
    'common.sale': 'Vente',
    'common.sales': 'Ventes',
    'common.house': 'Maison',
    'common.houses': 'Maisons',
    'common.apartment': 'Appartement',
    'common.apartments': 'Appartements',
    'common.land': 'Terrain',
    'common.lands': 'Terrains',
    'common.listings': 'annonces',
    'sections.featured': 'Annonces à la une',
    'sections.otherListings': 'Autres annonces',
    'sections.recent': 'Annonces récentes',
    'actions.search': 'Rechercher',
    'actions.publish': 'Publier',
    'actions.publishListing': 'Publier une annonce',
    'actions.allListings': 'Toutes les annonces',
    'actions.save': 'Enregistrer',
    'actions.map': 'Carte',
    'actions.menu': 'Menu',
    'actions.back': 'Retour',
    'actions.copyReference': 'Copier la référence',
    'actions.share': 'Partager',
    'actions.feature': 'Mettre à la une',
    'actions.unfeature': 'Retirer de la une',
    'actions.approve': 'Approuver',
    'actions.reject': 'Refuser',
    'actions.delete': 'Supprimer',
    'actions.close': 'Fermer',
    'actions.cancel': 'Annuler',
    'actions.send': 'Envoyer',
    'actions.changeLanguage': 'Changer de langue',
    'notifications.title': 'Notifications',
    'notifications.empty': 'Aucune notification pour le moment.',
    'notifications.adminSend': 'Envoyer une notification',
    'notifications.message': 'Message',
    'notifications.sent': 'Notification envoyée',
    'promo.title': 'Publiez gratuitement',
    'promo.text': 'Ajoutez une annonce avec vos propres photos depuis votre appareil.',
    'auth.login': 'Connexion',
    'auth.register': 'Inscription',
    'auth.loginRequired': 'Connexion requise',
    'auth.createAccount': 'Créer un compte',
    'auth.createToPublish': 'Créer un compte pour publier',
    'auth.loginSubmit': 'Se connecter',
    'auth.registerSubmit': 'Créer le compte',
    'auth.name': 'Nom',
    'auth.namePlaceholder': 'Votre nom',
    'auth.email': 'Email',
    'auth.phone': 'Téléphone',
    'auth.accountType': 'Type de compte',
    'auth.accountPersonal': 'Particulier',
    'auth.accountAgency': 'Agence immobilière',
    'auth.password': 'Mot de passe',
    'auth.passwordPlaceholder': 'Minimum 6 caractères',
    'auth.notePublish': 'Connectez-vous ou créez un compte pour publier votre annonce.',
    'auth.verifyToPublish': 'Votre compte doit être vérifié avant de publier une annonce.',
    'auth.noteMember': 'Connectez-vous pour accéder à vos annonces.',
    'auth.logout': 'Déconnexion',
    'listing.title': 'Titre',
    'listing.titlePlaceholder': 'Maison lumineuse',
    'listing.location': 'Ville / quartier',
    'listing.mapUrl': 'Lien Google Maps précis',
    'listing.mapUrlPlaceholder': 'https://maps.app.goo.gl/...',
    'listing.mapUrlRequired': 'Ajoutez le lien Google Maps précis',
    'listing.mapUrlInvalid': 'Indiquez un lien Google Maps valide',
    'listing.price': 'Prix Ariary',
    'listing.area': 'Surface m²',
    'listing.bedrooms': 'Chambres',
    'listing.image': 'Image',
    'listing.images': 'Photos',
    'listing.newImage': 'Nouvelle image',
    'listing.newImages': 'Nouvelles photos',
    'listing.maxPhotos': 'Maximum 5 photos',
    'listing.minPhotos': 'Minimum 3 photos',
    'listing.photoRange': 'Ajoutez entre 3 et 5 photos',
    'listing.reference': 'Référence',
    'listing.description': 'Description (habite avec le locataire, dans une clôture, en étage ou non, ...)',
    'listing.descriptionPlaceholder': 'Décrivez le bien, le quartier et les points forts.',
    'listing.noDescription': 'Aucune description détaillée n’a encore été ajoutée.',
    'listing.electricity': 'Courant Jirama',
    'listing.tapWater': 'Eau du robinet disponible',
    'listing.waterSource': 'Eau',
    'listing.waterWell': 'Puits',
    'listing.waterJirama': 'Jirama',
    'listing.waterOutside': 'Extérieur',
    'listing.shower': 'Douche',
    'listing.wc': 'WC',
    'listing.inside': 'Intérieur',
    'listing.outside': 'Extérieur',
    'listing.motorbikeAccess': 'Accès moto',
    'listing.carAccess': 'Accès voiture',
    'listing.yes': 'Oui',
    'listing.no': 'Non',
    'listing.availability': 'Disponibilité',
    'listing.available': 'Disponible',
    'listing.unavailable': 'Non disponible',
    'listing.pendingLocked': 'Une annonce en modération ne peut plus être modifiée.',
    'listing.callOwner': 'Appeler',
    'listing.ownerPhone': 'Téléphone annonceur',
    'listing.noOwnerPhone': 'Téléphone non renseigné',
    'listing.video': 'Vidéo de présentation',
    'listing.newVideo': 'Nouvelle vidéo de présentation',
    'listing.presentationVideo': 'Vidéo de présentation',
    'listing.personalRestriction': 'Les comptes particuliers publient uniquement des maisons en location.',
    'map.title': 'Localisation',
    'map.openExternal': 'Ouvrir dans Google Maps',
    'publish.title': 'Publier une annonce',
    'edit.title': 'Modifier l’annonce',
    'dashboard.total': 'Annonces',
    'dashboard.totalValue': 'Valeur totale',
    'admin.title': 'Administration',
    'admin.subtitle': 'Modération des annonces et gestion des comptes.',
    'admin.listings': 'Annonces',
    'admin.users': 'Comptes',
    'admin.status': 'Statut',
    'admin.role': 'Rôle',
    'admin.pending': 'En attente',
    'admin.approved': 'Validée',
    'admin.rejected': 'Refusée',
    'admin.featured': 'À la une',
    'admin.notFeatured': 'Non à la une',
    'admin.totalListings': 'Publications',
    'admin.totalUsers': 'Comptes',
    'admin.waiting': 'À modérer',
    'admin.admins': 'Admins',
    'admin.owner': 'Auteur',
    'admin.userReference': 'Référence utilisateur',
    'admin.refusalReason': 'Raison du refus',
    'admin.rejectReasonPrompt': 'Raison du refus de cette publication ?',
    'admin.createdAt': 'Créé le',
    'admin.actions': 'Actions',
    'admin.makeAdmin': 'Passer admin',
    'admin.makeUser': 'Passer membre',
    'admin.makeAgency': 'Passer agence',
    'admin.makePersonal': 'Passer particulier',
    'admin.protected': 'Compte protégé',
    'admin.verified': 'Vérifié',
    'admin.notVerified': 'Non vérifié',
    'admin.verifyIdentity': 'Vérifier identité',
    'admin.unverifyIdentity': 'Retirer vérification',
    'admin.accountStatus': 'Statut du compte',
    'admin.history': 'Historique',
    'admin.historyEmpty': 'Aucune activité enregistrée.',
    'admin.profile': 'Profil',
    'admin.profileOpen': 'Voir le profil',
    'admin.contact': 'Contact',
    'admin.publications': 'Publications',
    'profile.title': 'Profil annonceur',
    'profile.listings': 'Annonces publiées',
    'profile.empty': 'Aucune annonce publique pour ce profil.',
    'profile.viewOwner': 'Voir le profil',
    'admin.tableView': 'Tableau',
    'admin.simpleView': 'Simple',
    'empty.loading': 'Chargement...',
    'empty.noListing': 'Aucune annonce trouvée.',
    'empty.noCategory': 'Aucune annonce dans cette catégorie.',
    'empty.noMemberListing': 'Vous n’avez pas encore publié d’annonce.',
    'toast.loginToPublish': 'Connectez-vous pour publier une annonce',
    'toast.favoriteRemoved': 'Annonce retirée des favoris',
    'toast.favoriteAdded': 'Annonce ajoutée aux favoris',
    'toast.noFavorites': 'Aucun favori pour le moment',
    'toast.loginSuccess': 'Connexion réussie',
    'toast.logout': 'Vous êtes déconnecté',
    'toast.published': 'Annonce publiée',
    'toast.pendingReview': 'Annonce envoyée en modération',
    'toast.deleted': 'Annonce supprimée',
    'toast.updated': 'Annonce modifiée',
    'toast.referenceCopied': 'Référence copiée',
    'toast.linkCopied': 'Lien copié',
    'toast.featuredUpdated': 'Statut à la une modifié',
    'toast.moderated': 'Statut de modération modifié',
    'confirm.deleteListing': 'Supprimer définitivement cette publication ?',
    'confirm.deleteUser': 'Supprimer définitivement ce compte membre ?',
    'status.creating': 'Création...',
    'status.login': 'Connexion...',
    'status.publishing': 'Publication...',
    'status.saving': 'Enregistrement...',
    'unit.month': 'mois',
    'unit.bedrooms': 'ch.'
  },
  en: {
    'nav.home': 'Home',
    'nav.search': 'Search',
    'nav.listings': 'Listings',
    'nav.myListings': 'My listings',
    'nav.admin': 'Admin',
    'nav.favorites': 'Favorites',
    'chat.title': 'Messages',
    'chat.subtitle': 'Chat with listing owners or support.',
    'chat.support': 'Customer support',
    'chat.refresh': 'Refresh',
    'chat.pickConversation': 'Choose a conversation',
    'chat.placeholder': 'Your message',
    'chat.send': 'Send',
    'chat.noConversation': 'No conversation',
    'chat.openDirect': 'Chat',
    'chat.supportLabel': 'Customer support',
    'chat.directLabel': 'Client conversation',
    'chat.connected': 'Connected',
    'chat.offline': 'Offline',
    'chat.newMessage': 'New message',
    'verify.title': 'Verify my account',
    'verify.note': 'Send an ID or supporting document so support can validate your account.',
    'verify.fullName': 'Full name',
    'verify.documentType': 'Document type',
    'verify.other': 'Other',
    'verify.documents': 'Documents',
    'verify.message': 'Message',
    'verify.submit': 'Send',
    'verify.open': 'Request verification',
    'verify.pending': 'Request sent',
    'verify.sent': 'Verification request sent',
    'verify.status': 'Verification status',
    'hero.title': 'Find the home that fits you',
    'hero.subtitle': 'Homes for rent, properties for sale, and land across Madagascar.',
    'search.query': 'Search',
    'search.placeholder': 'City, neighborhood, property type',
    'search.deal': 'Listing',
    'search.property': 'Property',
    'search.maxPrice': 'Max price',
    'common.all': 'All',
    'common.allPlural': 'All',
    'common.location': 'Rental',
    'common.locations': 'Rentals',
    'common.sale': 'Sale',
    'common.sales': 'Sales',
    'common.house': 'House',
    'common.houses': 'Houses',
    'common.apartment': 'Apartment',
    'common.apartments': 'Apartments',
    'common.land': 'Land',
    'common.lands': 'Land',
    'common.listings': 'listings',
    'sections.featured': 'Featured listings',
    'sections.otherListings': 'Other listings',
    'sections.recent': 'Recent listings',
    'actions.search': 'Search',
    'actions.publish': 'Publish',
    'actions.publishListing': 'Publish a listing',
    'actions.allListings': 'All listings',
    'actions.save': 'Save',
    'actions.map': 'Map',
    'actions.menu': 'Menu',
    'actions.back': 'Back',
    'actions.copyReference': 'Copy reference',
    'actions.share': 'Share',
    'actions.feature': 'Feature',
    'actions.unfeature': 'Remove featured',
    'actions.approve': 'Approve',
    'actions.reject': 'Reject',
    'actions.delete': 'Delete',
    'actions.close': 'Close',
    'actions.cancel': 'Cancel',
    'actions.send': 'Send',
    'actions.changeLanguage': 'Change language',
    'notifications.title': 'Notifications',
    'notifications.empty': 'No notifications yet.',
    'notifications.adminSend': 'Send a notification',
    'notifications.message': 'Message',
    'notifications.sent': 'Notification sent',
    'promo.title': 'Publish for free',
    'promo.text': 'Add a listing with your own photos from your device.',
    'auth.login': 'Log in',
    'auth.register': 'Sign up',
    'auth.loginRequired': 'Login required',
    'auth.createAccount': 'Create an account',
    'auth.createToPublish': 'Create an account to publish',
    'auth.loginSubmit': 'Log in',
    'auth.registerSubmit': 'Create account',
    'auth.name': 'Name',
    'auth.namePlaceholder': 'Your name',
    'auth.email': 'Email',
    'auth.phone': 'Phone',
    'auth.accountType': 'Account type',
    'auth.accountPersonal': 'Individual',
    'auth.accountAgency': 'Real estate agency',
    'auth.password': 'Password',
    'auth.passwordPlaceholder': 'Minimum 6 characters',
    'auth.notePublish': 'Log in or create an account to publish your listing.',
    'auth.verifyToPublish': 'Your account must be verified before publishing a listing.',
    'auth.noteMember': 'Log in to access your listings.',
    'auth.logout': 'Log out',
    'listing.title': 'Title',
    'listing.titlePlaceholder': 'Bright house',
    'listing.location': 'City / neighborhood',
    'listing.mapUrl': 'Precise Google Maps link',
    'listing.mapUrlPlaceholder': 'https://maps.app.goo.gl/...',
    'listing.mapUrlRequired': 'Add the precise Google Maps link',
    'listing.mapUrlInvalid': 'Enter a valid Google Maps link',
    'listing.price': 'Price in Ariary',
    'listing.area': 'Area m²',
    'listing.bedrooms': 'Bedrooms',
    'listing.image': 'Image',
    'listing.images': 'Photos',
    'listing.newImage': 'New image',
    'listing.newImages': 'New photos',
    'listing.maxPhotos': 'Maximum 5 photos',
    'listing.minPhotos': 'Minimum 3 photos',
    'listing.photoRange': 'Add between 3 and 5 photos',
    'listing.reference': 'Reference',
    'listing.description': 'Description (living with the tenant, fenced property, upper floor or not, ...)',
    'listing.descriptionPlaceholder': 'Describe the property, the area, and the highlights.',
    'listing.noDescription': 'No detailed description has been added yet.',
    'listing.electricity': 'Jirama electricity',
    'listing.tapWater': 'Tap water available',
    'listing.waterSource': 'Water',
    'listing.waterWell': 'Well',
    'listing.waterJirama': 'Jirama',
    'listing.waterOutside': 'Outside',
    'listing.shower': 'Shower',
    'listing.wc': 'WC',
    'listing.inside': 'Inside',
    'listing.outside': 'Outside',
    'listing.motorbikeAccess': 'Motorbike access',
    'listing.carAccess': 'Car access',
    'listing.yes': 'Yes',
    'listing.no': 'No',
    'listing.availability': 'Availability',
    'listing.available': 'Available',
    'listing.unavailable': 'Unavailable',
    'listing.pendingLocked': 'A listing under moderation can no longer be edited.',
    'listing.callOwner': 'Call',
    'listing.ownerPhone': 'Advertiser phone',
    'listing.noOwnerPhone': 'No phone number provided',
    'listing.video': 'Presentation video',
    'listing.newVideo': 'New presentation video',
    'listing.presentationVideo': 'Presentation video',
    'listing.personalRestriction': 'Individual accounts can only publish houses for rent.',
    'map.title': 'Location',
    'map.openExternal': 'Open in Google Maps',
    'publish.title': 'Publish a listing',
    'edit.title': 'Edit listing',
    'dashboard.total': 'Listings',
    'dashboard.totalValue': 'Total value',
    'admin.title': 'Administration',
    'admin.subtitle': 'Listing moderation and account management.',
    'admin.listings': 'Listings',
    'admin.users': 'Accounts',
    'admin.status': 'Status',
    'admin.role': 'Role',
    'admin.pending': 'Pending',
    'admin.approved': 'Approved',
    'admin.rejected': 'Rejected',
    'admin.featured': 'Featured',
    'admin.notFeatured': 'Not featured',
    'admin.totalListings': 'Publications',
    'admin.totalUsers': 'Accounts',
    'admin.waiting': 'To moderate',
    'admin.admins': 'Admins',
    'admin.owner': 'Owner',
    'admin.userReference': 'User reference',
    'admin.refusalReason': 'Refusal reason',
    'admin.rejectReasonPrompt': 'Reason for refusing this listing?',
    'admin.createdAt': 'Created on',
    'admin.actions': 'Actions',
    'admin.makeAdmin': 'Make admin',
    'admin.makeUser': 'Make member',
    'admin.makeAgency': 'Make agency',
    'admin.makePersonal': 'Make personal',
    'admin.protected': 'Protected account',
    'admin.verified': 'Verified',
    'admin.notVerified': 'Not verified',
    'admin.verifyIdentity': 'Verify identity',
    'admin.unverifyIdentity': 'Remove verification',
    'admin.accountStatus': 'Account status',
    'admin.history': 'History',
    'admin.historyEmpty': 'No activity recorded.',
    'admin.profile': 'Profile',
    'admin.profileOpen': 'View profile',
    'admin.contact': 'Contact',
    'admin.publications': 'Publications',
    'profile.title': 'Owner profile',
    'profile.listings': 'Published listings',
    'profile.empty': 'No public listings for this profile.',
    'profile.viewOwner': 'View profile',
    'admin.tableView': 'Table',
    'admin.simpleView': 'Simple',
    'empty.loading': 'Loading...',
    'empty.noListing': 'No listings found.',
    'empty.noCategory': 'No listings in this category.',
    'empty.noMemberListing': 'You have not published any listings yet.',
    'toast.loginToPublish': 'Log in to publish a listing',
    'toast.favoriteRemoved': 'Listing removed from favorites',
    'toast.favoriteAdded': 'Listing added to favorites',
    'toast.noFavorites': 'No favorites yet',
    'toast.loginSuccess': 'Logged in successfully',
    'toast.logout': 'You are logged out',
    'toast.published': 'Listing published',
    'toast.pendingReview': 'Listing sent for moderation',
    'toast.deleted': 'Listing deleted',
    'toast.updated': 'Listing updated',
    'toast.referenceCopied': 'Reference copied',
    'toast.linkCopied': 'Link copied',
    'toast.featuredUpdated': 'Featured status updated',
    'toast.moderated': 'Moderation status updated',
    'confirm.deleteListing': 'Permanently delete this listing?',
    'confirm.deleteUser': 'Permanently delete this member account?',
    'status.creating': 'Creating...',
    'status.login': 'Logging in...',
    'status.publishing': 'Publishing...',
    'status.saving': 'Saving...',
    'unit.month': 'month',
    'unit.bedrooms': 'beds'
  },
  mg: {
    'nav.home': 'Fandraisana',
    'nav.search': 'Hikaroka',
    'nav.listings': 'Doka',
    'nav.myListings': 'Dokako',
    'nav.admin': 'Admin',
    'nav.favorites': 'Tiana',
    'chat.title': 'Hafatra',
    'chat.subtitle': 'Miresaha amin’ny mpamoaka doka na support.',
    'chat.support': 'Support client',
    'chat.refresh': 'Havaozy',
    'chat.pickConversation': 'Misafidiana resaka',
    'chat.placeholder': 'Ny hafatrao',
    'chat.send': 'Alefa',
    'chat.noConversation': 'Tsy misy resaka',
    'chat.openDirect': 'Hiresaka',
    'chat.supportLabel': 'Support client',
    'chat.directLabel': 'Resaka client',
    'chat.connected': 'Mifandray',
    'chat.offline': 'Tsy mifandray',
    'chat.newMessage': 'Hafatra vaovao',
    'verify.title': 'Hamarino ny kaontiko',
    'verify.note': 'Alefaso ny kara-panondro na porofo hanamarinana ny kaontinao.',
    'verify.fullName': 'Anarana feno',
    'verify.documentType': 'Karazana taratasy',
    'verify.other': 'Hafa',
    'verify.documents': 'Taratasy',
    'verify.message': 'Hafatra',
    'verify.submit': 'Alefa',
    'verify.open': 'Hangataka fanamarinana',
    'verify.pending': 'Nalefa ny fangatahana',
    'verify.sent': 'Nalefa ny fangatahana fanamarinana',
    'verify.status': 'Satan’ny fanamarinana',
    'hero.title': 'Tadiavo ny trano mifanaraka aminao',
    'hero.subtitle': 'Trano hofaina, trano amidy ary tany manerana an’i Madagasikara.',
    'search.query': 'Fikarohana',
    'search.placeholder': 'Tanàna, fokontany, karazana trano',
    'search.deal': 'Karazana doka',
    'search.property': 'Karazana fananana',
    'search.maxPrice': 'Vidiny ambony indrindra',
    'common.all': 'Rehetra',
    'common.allPlural': 'Rehetra',
    'common.location': 'Hofan-trano',
    'common.locations': 'Hofan-trano',
    'common.sale': 'Amidy',
    'common.sales': 'Amidy',
    'common.house': 'Trano',
    'common.houses': 'Trano',
    'common.apartment': 'Appartement',
    'common.apartments': 'Appartement',
    'common.land': 'Tany',
    'common.lands': 'Tany',
    'common.listings': 'doka',
    'sections.featured': 'Doka asongadina',
    'sections.otherListings': 'Doka hafa',
    'sections.recent': 'Doka vao haingana',
    'actions.search': 'Hikaroka',
    'actions.publish': 'Hamoaka',
    'actions.publishListing': 'Hamoaka doka',
    'actions.allListings': 'Doka rehetra',
    'actions.save': 'Tehirizo',
    'actions.map': 'Sarintany',
    'actions.menu': 'Menu',
    'actions.back': 'Hiverina',
    'actions.copyReference': 'Adikao ny laharana',
    'actions.share': 'Hizara',
    'actions.feature': 'Ataovy asongadina',
    'actions.unfeature': 'Esory amin’ny asongadina',
    'actions.approve': 'Ekena',
    'actions.reject': 'Lavina',
    'actions.delete': 'Fafana',
    'actions.close': 'Hidio',
    'actions.cancel': 'Foano',
    'actions.send': 'Alefaso',
    'actions.changeLanguage': 'Hanova fiteny',
    'notifications.title': 'Fampandrenesana',
    'notifications.empty': 'Tsy mbola misy fampandrenesana.',
    'notifications.adminSend': 'Handefa fampandrenesana',
    'notifications.message': 'Hafatra',
    'notifications.sent': 'Nalefa ny fampandrenesana',
    'promo.title': 'Hamoaka maimaim-poana',
    'promo.text': 'Ampidiro miaraka amin’ny sarinao avy amin’ny fitaovanao ny doka.',
    'auth.login': 'Hiditra',
    'auth.register': 'Hisoratra',
    'auth.loginRequired': 'Mila miditra',
    'auth.createAccount': 'Hamorona kaonty',
    'auth.createToPublish': 'Hamorona kaonty hamoahana doka',
    'auth.loginSubmit': 'Hiditra',
    'auth.registerSubmit': 'Hamorona kaonty',
    'auth.name': 'Anarana',
    'auth.namePlaceholder': 'Ny anaranao',
    'auth.email': 'Mailaka',
    'auth.phone': 'Finday',
    'auth.accountType': 'Karazana kaonty',
    'auth.accountPersonal': 'Olon-tsotra',
    'auth.accountAgency': 'Agence immobilière',
    'auth.password': 'Teny miafina',
    'auth.passwordPlaceholder': 'Farafahakeliny 6 litera',
    'auth.notePublish': 'Midira na misorata anarana vao afaka mamoaka doka.',
    'auth.verifyToPublish': 'Tsy maintsy hamarinin’ny admin aloha ny kaontinao vao afaka mamoaka doka.',
    'auth.noteMember': 'Midira raha hijery sy hitantana ny dokanao.',
    'auth.logout': 'Hivoaka',
    'listing.title': 'Lohateny',
    'listing.titlePlaceholder': 'Trano mamirapiratra',
    'listing.location': 'Tanàna / fokontany',
    'listing.mapUrl': 'Rohy Google Maps mazava',
    'listing.mapUrlPlaceholder': 'https://maps.app.goo.gl/...',
    'listing.mapUrlRequired': 'Ampidiro ny rohy Google Maps mazava',
    'listing.mapUrlInvalid': 'Ampidiro rohy Google Maps marina',
    'listing.price': 'Vidiny Ariary',
    'listing.area': 'Velarana m²',
    'listing.bedrooms': 'Efitra fatoriana',
    'listing.image': 'Sary',
    'listing.images': 'Sary',
    'listing.newImage': 'Sary vaovao',
    'listing.newImages': 'Sary vaovao',
    'listing.maxPhotos': 'Sary 5 farafahabetsany',
    'listing.minPhotos': 'Sary 3 farafahakeliny',
    'listing.photoRange': 'Ampidiro sary 3 hatramin’ny 5',
    'listing.reference': 'Laharana',
    'listing.description': 'Fanazavana (miara-mipetraka amin’ny mpanofa, misy fefy, rihana na tsia, ...)',
    'listing.descriptionPlaceholder': 'Farito ny fananana, ny manodidina ary ny tombony.',
    'listing.noDescription': 'Tsy mbola misy fanazavana feno.',
    'listing.electricity': 'Jiro Jirama',
    'listing.tapWater': 'Misy rano paompy',
    'listing.waterSource': 'Rano',
    'listing.waterWell': 'Vovo',
    'listing.waterJirama': 'Jirama',
    'listing.waterOutside': 'Ivelany',
    'listing.shower': 'Douche',
    'listing.wc': 'WC',
    'listing.inside': 'Ao anatiny',
    'listing.outside': 'Ivelany',
    'listing.motorbikeAccess': 'Afaka idiran’ny moto',
    'listing.carAccess': 'Afaka idiran’ny fiara',
    'listing.yes': 'Eny',
    'listing.no': 'Tsia',
    'listing.availability': 'Fahafahana',
    'listing.available': 'Mbola misy',
    'listing.unavailable': 'Tsy misy',
    'listing.pendingLocked': 'Tsy azo ovaina intsony ny doka mbola hamarinina.',
    'listing.callOwner': 'Antsoy',
    'listing.ownerPhone': 'Findain’ny mpamoaka',
    'listing.noOwnerPhone': 'Tsy mbola misy finday',
    'listing.video': 'Lahatsary fampahafantarana',
    'listing.newVideo': 'Lahatsary vaovao fampahafantarana',
    'listing.presentationVideo': 'Lahatsary fampahafantarana',
    'listing.personalRestriction': 'Ny kaonty olon-tsotra dia afaka mamoaka trano hofaina ihany.',
    'map.title': 'Toerana',
    'map.openExternal': 'Sokafy ao amin’ny Google Maps',
    'publish.title': 'Hamoaka doka',
    'edit.title': 'Hanova doka',
    'dashboard.total': 'Doka',
    'dashboard.totalValue': 'Tontalin’ny vidiny',
    'admin.title': 'Fitantanana',
    'admin.subtitle': 'Fanamarinana doka sy fitantanana kaonty.',
    'admin.listings': 'Doka',
    'admin.users': 'Kaonty',
    'admin.status': 'Sata',
    'admin.role': 'Andraikitra',
    'admin.pending': 'Miandry',
    'admin.approved': 'Ekena',
    'admin.rejected': 'Nolavina',
    'admin.featured': 'Asongadina',
    'admin.notFeatured': 'Tsy asongadina',
    'admin.totalListings': 'Doka',
    'admin.totalUsers': 'Kaonty',
    'admin.waiting': 'Miandry fanamarinana',
    'admin.admins': 'Admin',
    'admin.owner': 'Mpamoaka',
    'admin.userReference': 'Laharan’ny mpampiasa',
    'admin.refusalReason': 'Antony nandavana',
    'admin.rejectReasonPrompt': 'Antony handavana ity doka ity?',
    'admin.createdAt': 'Noforonina',
    'admin.actions': 'Asa',
    'admin.makeAdmin': 'Ataovy admin',
    'admin.makeUser': 'Ataovy membre',
    'admin.makeAgency': 'Ataovy agence',
    'admin.makePersonal': 'Ataovy particulier',
    'admin.protected': 'Kaonty voaaro',
    'admin.verified': 'Voamarina',
    'admin.notVerified': 'Tsy voamarina',
    'admin.verifyIdentity': 'Hamarino identité',
    'admin.unverifyIdentity': 'Esory fanamarinana',
    'admin.accountStatus': 'Satan’ny kaonty',
    'admin.history': 'Tantara',
    'admin.historyEmpty': 'Tsy mbola misy asa voatahiry.',
    'admin.profile': 'Profil',
    'admin.profileOpen': 'Hijery profil',
    'admin.contact': 'Fifandraisana',
    'admin.publications': 'Doka',
    'profile.title': 'Profil mpamoaka',
    'profile.listings': 'Doka navoaka',
    'profile.empty': 'Tsy misy doka hita amin’ity profil ity.',
    'profile.viewOwner': 'Hijery profil',
    'admin.tableView': 'Tabilao',
    'admin.simpleView': 'Tsotra',
    'empty.loading': 'Miandry...',
    'empty.noListing': 'Tsy misy doka hita.',
    'empty.noCategory': 'Tsy misy doka amin’ity sokajy ity.',
    'empty.noMemberListing': 'Mbola tsy namoaka doka ianao.',
    'toast.loginToPublish': 'Midira aloha vao mamoaka doka',
    'toast.favoriteRemoved': 'Nesorina tao amin’ny tiana',
    'toast.favoriteAdded': 'Nampidirina tao amin’ny tiana',
    'toast.noFavorites': 'Tsy mbola misy tiana',
    'toast.loginSuccess': 'Tafiditra soa aman-tsara',
    'toast.logout': 'Nivoaka ianao',
    'toast.published': 'Nivoaka ny doka',
    'toast.pendingReview': 'Nalefa hohamarinin’ny admin ny doka',
    'toast.deleted': 'Voafafa ny doka',
    'toast.updated': 'Voahitsy ny doka',
    'toast.referenceCopied': 'Voakopia ny laharana',
    'toast.linkCopied': 'Voakopia ny rohy',
    'toast.featuredUpdated': 'Niova ny sata asongadina',
    'toast.moderated': 'Niova ny satan’ny doka',
    'confirm.deleteListing': 'Hofafana tanteraka ve ity doka ity?',
    'confirm.deleteUser': 'Hofafana tanteraka ve ity kaonty ity?',
    'status.creating': 'Mamorona...',
    'status.login': 'Miditra...',
    'status.publishing': 'Mamoaka...',
    'status.saving': 'Mitahiry...',
    'unit.month': 'volana',
    'unit.bedrooms': 'efitra'
  }
};

function icons() {
  if (window.lucide) window.lucide.createIcons();
}

function t(key) {
  return i18n[state.lang][key] || i18n.fr[key] || key;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function translatePage() {
  const language = languages[state.lang] || languages.fr;
  document.documentElement.lang = language.htmlLang;
  els.langFlag.textContent = language.flag;
  els.langCode.textContent = language.code;

  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });

  document.querySelectorAll('[data-i18n-attr]').forEach((element) => {
    element.dataset.i18nAttr.split(',').forEach((entry) => {
      const [attribute, key] = entry.split(':');
      element.setAttribute(attribute.trim(), t(key.trim()));
    });
  });

  setAuthMode(state.authMode);
  if (els.authModal.open) {
    els.authNote.textContent = state.afterAuth === 'publish'
      ? t('auth.notePublish')
      : t('auth.noteMember');
  }
}

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('visible');
  window.setTimeout(() => els.toast.classList.remove('visible'), 2300);
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement('input');
  input.value = value;
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  input.remove();
}

function headers() {
  return state.token ? { Authorization: `Bearer ${state.token}` } : {};
}

async function api(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Une erreur est survenue' }));
    throw new Error(error.message);
  }
  if (response.status === 204) return null;
  return response.json();
}

function price(value, dealType) {
  const formatted = new Intl.NumberFormat('fr-MG').format(value);
  return dealType === 'location' ? `${formatted} Ar / ${t('unit.month')}` : `${formatted} Ar`;
}

function saveFavorites() {
  localStorage.setItem('maisonMadaFavorites', JSON.stringify([...state.favorites]));
}

function applyTheme(theme) {
  const dark = theme === 'dark';
  document.body.classList.toggle('dark-mode', dark);
  document.documentElement.classList.toggle('dark-mode', dark);
  localStorage.setItem('maisonMadaTheme', dark ? 'dark' : 'light');
  els.themeToggle.innerHTML = `<i data-lucide="${dark ? 'sun' : 'moon'}"></i>`;
  els.themeToggle.title = dark ? 'Mode clair' : 'Mode sombre';
  icons();
}

function updateAdminVisibility() {
  document.querySelectorAll('[data-admin-only]').forEach((element) => {
    element.hidden = state.user?.role !== 'admin';
  });
}

function updateAuthenticatedActions() {
  const connected = Boolean(state.user);
  [
    document.querySelector('#favoritesButton'),
    els.chatOpenButton,
    els.notificationsOpenButton,
    ...document.querySelectorAll('[data-auth-required]'),
    ...document.querySelectorAll('[data-publish-open]')
  ].forEach((element) => {
    if (element) element.hidden = !connected;
  });

  if (!connected) {
    closeChatQuickPanel();
    closeNotificationsQuickPanel();
    if (els.chatDrawer) els.chatDrawer.hidden = true;
  }
}

function setAuthMode(mode) {
  state.authMode = mode;
  const register = mode === 'register';
  if (state.afterAuth === 'publish') {
    els.authTitle.textContent = register ? t('auth.createToPublish') : t('auth.loginRequired');
  } else {
    els.authTitle.textContent = register ? t('auth.createAccount') : t('auth.login');
  }
  els.authSubmit.textContent = register ? t('auth.registerSubmit') : t('auth.loginSubmit');
  document.querySelectorAll('[data-auth-mode]').forEach((button) => {
    button.classList.toggle('active', button.dataset.authMode === mode);
  });
  document.querySelectorAll('.register-field').forEach((field) => {
    field.hidden = !register;
    field.querySelectorAll('input, select').forEach((input) => {
      input.disabled = !register;
      input.required = register && input.name === 'name';
    });
  });
  els.authStatus.textContent = '';
}

function openAuth(afterAuth) {
  state.afterAuth = afterAuth;
  setAuthMode('login');
  els.authForm.reset();
  els.authNote.textContent = afterAuth === 'publish'
    ? t('auth.notePublish')
    : t('auth.noteMember');
  els.authModal.showModal();
}

function publishDraftKey() {
  return `maisonMadaPublishDraft:${state.user?._id || 'guest'}`;
}

function savePublishDraft() {
  if (!state.user || !els.publishForm) return;

  const draft = {};
  Array.from(els.publishForm.elements).forEach((field) => {
    if (!field.name || field.type === 'file') return;
    if (field.type === 'checkbox') {
      draft[field.name] = field.checked;
      return;
    }
    draft[field.name] = field.value;
  });
  localStorage.setItem(publishDraftKey(), JSON.stringify(draft));
}

function restorePublishDraft() {
  if (!state.user || !els.publishForm) return;

  const rawDraft = localStorage.getItem(publishDraftKey());
  if (!rawDraft) return;

  try {
    const draft = JSON.parse(rawDraft);
    Object.entries(draft).forEach(([name, value]) => {
      const field = els.publishForm.elements[name];
      if (!field || field.type === 'file') return;
      if (field.type === 'checkbox') {
        field.checked = Boolean(value);
        return;
      }
      field.value = value;
    });
  } catch (_error) {
    localStorage.removeItem(publishDraftKey());
  }
}

function clearPublishDraft() {
  localStorage.removeItem(publishDraftKey());
}

function openPublish() {
  if (!state.user) {
    toast(t('toast.loginToPublish'));
    openAuth('publish');
    return;
  }

  if (state.user.role !== 'admin' && state.user.identityVerified !== true) {
    toast(t('auth.verifyToPublish'));
    return;
  }

  closeMember();
  els.publishStatus.textContent = '';
  els.publishForm.reset();
  restorePublishDraft();
  applyListingFormRules(els.publishForm);
  if (!isAgencyAccount()) els.publishStatus.textContent = t('listing.personalRestriction');
  els.publishModal.showModal();
}

function closeMember() {
  closeMemberProfile();
  closeNotificationsPanel();
  closeNotificationsQuickPanel();
  els.memberModal.classList.remove('is-open');
  els.memberModal.hidden = true;
}

function closeMemberProfile() {
  els.memberProfilePanel.hidden = true;
  els.memberProfileContent.innerHTML = '';
}

function openVerificationModal() {
  if (!state.user) return;
  els.verificationStatus.textContent = '';
  els.verificationForm.reset();
  els.verificationForm.elements.fullName.value = state.user.name || '';
  els.verificationModal.showModal();
}

function closeVerificationModal() {
  els.verificationModal.close();
}

function closeNotificationsPanel() {
  els.memberNotificationsPanel.hidden = true;
}

function notificationIcon(type) {
  if (type === 'listing.rejected') return 'x-circle';
  if (type === 'listing.approved') return 'check-circle-2';
  return 'bell';
}

function renderNotifications() {
  const items = state.notificationsData || [];
  els.memberNotifications.innerHTML = items.length
    ? items.map((item) => `
      <article class="notification-item ${item.readAt ? '' : 'unread'}">
        <div class="notification-icon"><i data-lucide="${notificationIcon(item.type)}"></i></div>
        <div>
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.message)}</p>
          <span>${formatDateTime(item.createdAt)}</span>
        </div>
      </article>
    `).join('')
    : `<div class="empty">${t('notifications.empty')}</div>`;
  icons();
}

function renderNotificationsQuick() {
  if (!els.notificationsQuickList) return;
  const items = state.notificationsData || [];
  els.notificationsQuickList.innerHTML = items.length
    ? items.map((item) => `
      <article class="popover-item ${item.readAt ? '' : 'unread'}">
        <div class="popover-avatar"><i data-lucide="${notificationIcon(item.type)}"></i></div>
        <div class="popover-copy">
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.message)}</p>
          <span>${formatDateTime(item.createdAt)}</span>
        </div>
        ${item.readAt ? '' : '<span class="popover-dot"></span>'}
      </article>
    `).join('')
    : `<div class="empty">${t('notifications.empty')}</div>`;
  const unread = items.filter((item) => !item.readAt).length;
  els.notificationsOpenButton.classList.toggle('has-unread', unread > 0);
  els.notificationsOpenButton.dataset.unreadCount = unread ? String(unread) : '';
  icons();
}

async function loadNotifications({ markRead = false } = {}) {
  state.notificationsData = await api('/api/auth/notifications', { headers: headers() });
  renderNotifications();
  renderNotificationsQuick();
  if (markRead && state.notificationsData.some((item) => !item.readAt)) {
    await api('/api/auth/notifications/read', { method: 'POST', headers: headers() });
    const readAt = new Date().toISOString();
    state.notificationsData = state.notificationsData.map((item) => item.readAt ? item : { ...item, readAt });
    renderNotifications();
    renderNotificationsQuick();
  }
}

async function openNotificationsPanel() {
  if (!state.user) return;
  closeMemberProfile();
  els.memberNotificationsPanel.hidden = false;
  els.memberNotifications.innerHTML = `<div class="empty">${t('empty.loading')}</div>`;
  await loadNotifications({ markRead: true });
}

async function openNotificationsFromTopbar() {
  if (!state.user) {
    openAuth('member');
    return;
  }

  closeChatQuickPanel();
  els.notificationsQuickPanel.hidden = !els.notificationsQuickPanel.hidden;
  if (els.notificationsQuickPanel.hidden) return;
  els.notificationsQuickList.innerHTML = `<div class="empty">${t('empty.loading')}</div>`;
  await loadNotifications({ markRead: true });
}

async function promptTextarea({ title, text, placeholder, confirmText }) {
  if (!window.Swal) {
    const value = window.prompt(text || title, '');
    return value?.trim() || null;
  }

  const styles = getComputedStyle(document.body);
  const result = await window.Swal.fire({
    title,
    text,
    input: 'textarea',
    inputPlaceholder: placeholder,
    inputAttributes: { 'aria-label': text },
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: t('actions.cancel'),
    confirmButtonColor: styles.getPropertyValue('--green').trim() || '#08944a',
    background: styles.getPropertyValue('--surface').trim() || '#fff',
    color: styles.getPropertyValue('--ink').trim() || '#101620',
    inputValidator: (value) => value.trim() ? undefined : t('notifications.message')
  });

  return result.isConfirmed ? result.value.trim() : null;
}

function requestRejectReason() {
  return promptTextarea({
    title: t('actions.reject'),
    text: t('admin.rejectReasonPrompt'),
    placeholder: 'Exemple : photos insuffisantes, localisation imprécise, informations manquantes...',
    confirmText: t('actions.reject')
  });
}

function requestAdminMessage(user) {
  const target = user ? `${user.name || user.email} - ${user.email}` : '';
  return promptTextarea({
    title: t('notifications.adminSend'),
    text: target,
    placeholder: 'Votre message pour cet utilisateur...',
    confirmText: t('actions.send')
  });
}

function closeAdmin() {
  closeAdminActivity();
  closeAdminProfile();
  els.adminModal.classList.remove('is-open');
  els.adminModal.hidden = true;
}

function closeMap() {
  els.mapModal.close();
  els.mapFrame.src = '';
}

function setMobileMenu(open) {
  document.body.classList.toggle('menu-open', open);
  els.menuToggle.setAttribute('aria-expanded', String(open));
  els.menuToggle.innerHTML = `<i data-lucide="${open ? 'x' : 'menu'}"></i>`;
  icons();
}

async function openMember() {
  if (!state.user) {
    openAuth('member');
    return;
  }

  els.memberIdentity.innerHTML = `
    <span>${state.user.name} - ${state.user.email}</span>
    ${state.user.reference ? `<span class="member-reference">${t('admin.userReference')} : ${state.user.reference}${referenceButton(state.user.reference)}</span>` : ''}
  `;
  els.memberModal.hidden = false;
  els.memberModal.classList.add('is-open');
  icons();
  await Promise.all([loadMemberListings(), loadNotifications()]);
}

async function openAdmin() {
  if (!state.user) {
    openAuth('member');
    return;
  }

  if (state.user.role !== 'admin') {
    toast('Acces administrateur requis');
    return;
  }

  closeMember();
  els.adminModal.hidden = false;
  els.adminModal.classList.add('is-open');
  await loadAdminData();
}

function mapQuery(location) {
  return `${location}, Madagascar`;
}

function fallbackMapUrl(location) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery(location))}`;
}

function listingMapUrl(listing) {
  return listing.mapUrl || fallbackMapUrl(listing.location);
}

function listingMapEmbedUrl(listing) {
  return listing.mapEmbedUrl || mapEmbedSrc(listing.location, listing.mapUrl);
}

function isGoogleMapsUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    const googleMapsHosts = ['google.com', 'maps.google.com', 'maps.app.goo.gl', 'goo.gl'];
    return ['http:', 'https:'].includes(url.protocol)
      && googleMapsHosts.includes(host)
      && (host === 'maps.app.goo.gl' || host === 'maps.google.com' || url.pathname.startsWith('/maps'));
  } catch (_error) {
    return false;
  }
}

function mapButton(listing) {
  return `
    <button class="map-btn" type="button" data-map-location="${encodeURIComponent(listing.location)}" data-map-url="${encodeURIComponent(listingMapUrl(listing))}" data-map-embed-url="${encodeURIComponent(listingMapEmbedUrl(listing))}">
      <i data-lucide="map-pin"></i>${t('actions.map')}
    </button>
  `;
}

function openMap(location, mapUrl = '', mapEmbedUrl = '') {
  const externalUrl = mapUrl || fallbackMapUrl(location);
  els.mapTitle.textContent = location;
  els.mapFrame.src = mapEmbedUrl || mapEmbedSrc(location, mapUrl);
  els.mapExternalLink.href = externalUrl;
  els.mapModal.showModal();
}

function detailMapSrc(location) {
  return `https://www.google.com/maps?q=${encodeURIComponent(mapQuery(location))}&output=embed`;
}

function mapEmbedSrc(location, mapUrl = '') {
  try {
    const url = new URL(mapUrl);
    if (url.pathname.includes('/maps/embed')) return mapUrl;

    const coordinates = decodeURIComponent(url.href).match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (coordinates) {
      return `https://www.google.com/maps?q=${coordinates[1]},${coordinates[2]}&output=embed`;
    }

    const query = url.searchParams.get('query') || url.searchParams.get('q');
    if (query) {
      return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
    }
  } catch (_error) {
    return detailMapSrc(location);
  }

  return detailMapSrc(location);
}

function phoneHref(phone) {
  const cleaned = String(phone || '').replace(/[^\d+]/g, '');
  return cleaned ? `tel:${cleaned}` : '';
}

function ownerPhoneLink(listing, className = 'call-btn') {
  const href = phoneHref(listing.ownerPhone);
  if (!href) return '';
  const phone = escapeHtml(listing.ownerPhone);

  return `
    <a class="${className}" href="${href}" aria-label="${t('listing.callOwner')} ${phone}">
      <i data-lucide="phone-call"></i>
      <span>${phone}</span>
    </a>
  `;
}

function ownerProfileLink(listing, className = 'owner-profile-link') {
  const ownerName = escapeHtml(listing.ownerName || 'MaisonMada');
  if (!listing.ownerId) return `<span class="${className}"><i data-lucide="user"></i>${ownerName}</span>`;
  return `
    <a class="${className}" href="#profile/${listing.ownerId}" data-profile-link="${listing.ownerId}" aria-label="${t('profile.viewOwner')}">
      <i data-lucide="user"></i><span>${ownerName}</span>
    </a>
  `;
}

function ownerChatButton(listing, className = 'map-btn') {
  if (!listing.ownerId || String(listing.ownerId) === String(state.user?._id)) return '';

  return `
    <button class="${className}" type="button" data-chat-owner="${listing.ownerId}" data-chat-listing="${listing._id}" data-chat-name="${escapeHtml(listing.ownerName || 'MaisonMada')}">
      <i data-lucide="message-circle"></i>${t('chat.openDirect')}
    </button>
  `;
}

function waterSourceLabel(listing) {
  const source = listing.waterSource || (listing.hasTapWater === false ? 'exterieur' : 'jirama');
  const labels = {
    puits: 'listing.waterWell',
    jirama: 'listing.waterJirama',
    exterieur: 'listing.waterOutside'
  };
  return t(labels[source] || labels.jirama);
}

function insideOutsideLabel(value) {
  return value === 'exterieur' ? t('listing.outside') : t('listing.inside');
}

function listingImages(listing) {
  return Array.isArray(listing.images) && listing.images.length
    ? listing.images.slice(0, 5)
    : [listing.image];
}

function primaryImage(listing) {
  return listingImages(listing)[0];
}

function isAgencyAccount() {
  return state.user?.accountType === 'agence' || state.user?.role === 'admin';
}

function isHouseRental(listing) {
  return listing.dealType === 'location' && listing.propertyType === 'maison';
}

function areaMarkup(listing) {
  return isHouseRental(listing) ? '' : `<span><i data-lucide="scan"></i>${listing.area} m²</span>`;
}

function referenceButton(reference) {
  if (!reference) return '';

  return `
    <button class="copy-ref-btn" type="button" data-copy-reference="${reference}" aria-label="${t('actions.copyReference')}">
      <i data-lucide="copy"></i>
    </button>
  `;
}

function listingShareUrl(listing) {
  const url = new URL(window.location.href);
  url.hash = `listing/${listing._id}`;
  return url.href;
}

function canShareListing(listing) {
  return listing.status === undefined || listing.status === 'approved';
}

function shareButton(listing, className = 'map-btn') {
  if (!canShareListing(listing)) return '';

  return `
    <button class="${className}" type="button" data-share-listing="${listing._id}" data-share-url="${listingShareUrl(listing)}" aria-label="${t('actions.share')}" title="${t('actions.share')}">
      <i data-lucide="share-2"></i>${className === 'icon-btn' ? '' : t('actions.share')}
    </button>
  `;
}

async function shareListing(listing, url) {
  if (navigator.share) {
    await navigator.share({
      title: listing.title,
      text: `${listing.title} - ${listing.location}`,
      url
    });
    return;
  }

  await copyText(url);
  toast(t('toast.linkCopied'));
}

function availabilityText(listing) {
  return listing.isAvailable === false ? t('listing.unavailable') : t('listing.available');
}

function applyListingFormRules(form) {
  if (!form) return;

  const personal = !isAgencyAccount();
  const dealField = form.querySelector('[data-deal-field]');
  const propertyField = form.querySelector('[data-property-field]');
  const areaField = form.querySelector('[data-area-field]');
  const houseFields = form.querySelectorAll('[data-house-field]');

  if (personal) {
    form.elements.dealType.value = 'location';
    form.elements.propertyType.value = 'maison';
  }

  form.elements.dealType.disabled = personal;
  form.elements.propertyType.disabled = personal;
  dealField.hidden = personal;
  propertyField.hidden = personal;

  const hideArea = form.elements.dealType.value === 'location' && form.elements.propertyType.value === 'maison';
  areaField.hidden = hideArea;
  form.elements.area.disabled = hideArea;
  if (hideArea) form.elements.area.value = 0;

  const house = form.elements.propertyType.value === 'maison';
  houseFields.forEach((field) => {
    field.hidden = !house;
    field.querySelectorAll('select').forEach((select) => {
      select.disabled = !house;
    });
  });

  if (!house) {
    form.elements.isAvailable.value = 'true';
  }
}

function openListingDetail(listing) {
  const sale = listing.dealType === 'vente';
  const hasElectricity = Boolean(listing.hasElectricity);
  const hasMotorbikeAccess = Boolean(listing.hasMotorbikeAccess);
  const hasCarAccess = Boolean(listing.hasCarAccess);
  const images = listingImages(listing);
  const callLink = ownerPhoneLink(listing, 'primary-btn call-link');
  const title = escapeHtml(listing.title);
  const location = escapeHtml(listing.location);
  const propertyType = escapeHtml(listing.propertyType);
  const description = escapeHtml(listing.description || t('listing.noDescription'));
  els.detailTitle.textContent = listing.title;
  els.detailReference.innerHTML = `${t('listing.reference')} ${listing.reference || ''} ${referenceButton(listing.reference)}`;
  els.detailContent.innerHTML = `
    <div class="detail-hero">
      <div class="detail-gallery">
        <img class="detail-main-image" src="${images[0]}" alt="${title}">
        ${images.length > 1 ? `
          <div class="detail-thumbs">
            ${images.map((image, index) => `<img src="${image}" alt="${title} ${index + 1}">`).join('')}
          </div>
        ` : ''}
      </div>
      <div class="detail-summary">
        <div class="price ${sale ? 'sale' : ''}">${price(listing.price, listing.dealType)}</div>
        <div class="muted">${location}</div>
        <div class="owner-contact">
          ${ownerProfileLink(listing)}
          ${callLink || `<span><i data-lucide="phone"></i>${t('listing.noOwnerPhone')}</span>`}
          ${ownerChatButton(listing, 'primary-btn call-link')}
        </div>
        <div class="detail-facts">
          <span>${sale ? t('common.sale') : t('common.location')}</span>
          <span>${propertyType}</span>
          <span>${listing.bedrooms} ${t('unit.bedrooms')}</span>
          ${isHouseRental(listing) ? '' : `<span>${listing.area} m²</span>`}
          ${listing.propertyType === 'maison' ? `<span>${availabilityText(listing)}</span>` : ''}
        </div>
        <div class="detail-utilities">
          <span><i data-lucide="${hasElectricity ? 'zap' : 'zap-off'}"></i>${t('listing.electricity')} : ${hasElectricity ? t('listing.yes') : t('listing.no')}</span>
          <span><i data-lucide="droplets"></i>${t('listing.waterSource')} : ${waterSourceLabel(listing)}</span>
          <span><i data-lucide="bath"></i>${t('listing.shower')} : ${insideOutsideLabel(listing.showerLocation || listing.showerWcLocation)}</span>
          <span><i data-lucide="toilet"></i>${t('listing.wc')} : ${insideOutsideLabel(listing.wcLocation || listing.showerWcLocation)}</span>
          <span><i data-lucide="${hasMotorbikeAccess ? 'bike' : 'circle-slash'}"></i>${t('listing.motorbikeAccess')} : ${hasMotorbikeAccess ? t('listing.yes') : t('listing.no')}</span>
          <span><i data-lucide="${hasCarAccess ? 'car' : 'circle-slash'}"></i>${t('listing.carAccess')} : ${hasCarAccess ? t('listing.yes') : t('listing.no')}</span>
        </div>
      </div>
    </div>
    ${listing.video ? `
      <div class="detail-video">
        <h3>${t('listing.presentationVideo')}</h3>
        <video src="${listing.video}" controls playsinline></video>
      </div>
    ` : ''}
    <p class="detail-description">${description}</p>
    <iframe class="map-frame" title="Google Maps" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${listingMapEmbedUrl(listing)}"></iframe>
    <div class="modal-actions">
      <span></span>
      ${shareButton(listing, 'primary-btn map-link')}
      <a class="primary-btn map-link" href="${listingMapUrl(listing)}" target="_blank" rel="noreferrer">
        <span>${t('map.openExternal')}</span>
        <i data-lucide="external-link"></i>
      </a>
    </div>
  `;
  els.detailModal.showModal();
  icons();
}

function listingCard(listing) {
  const favorite = state.favorites.has(String(listing._id));
  const sale = listing.dealType === 'vente';
  const callLink = ownerPhoneLink(listing);
  const title = escapeHtml(listing.title);
  const location = escapeHtml(listing.location);

  return `
    <article class="listing-card" data-detail-id="${listing._id}">
      <div class="listing-media">
        <img src="${primaryImage(listing)}" alt="${title}">
          <span class="badge ${sale ? 'sale' : ''}">${sale ? t('common.sale') : t('common.location')}</span>
        <button class="favorite-btn ${favorite ? 'active' : ''}" type="button" data-favorite="${listing._id}">
          <i data-lucide="heart"></i>
        </button>
      </div>
      <div class="listing-body">
        <h3>${title}</h3>
        <div class="muted">${location}</div>
        <div class="price ${sale ? 'sale' : ''}">${price(listing.price, listing.dealType)}</div>
        <div class="features">
          <span><i data-lucide="bed-double"></i>${listing.bedrooms} ${t('unit.bedrooms')}</span>
          ${areaMarkup(listing)}
          ${listing.propertyType === 'maison' ? `<span><i data-lucide="circle-check"></i>${availabilityText(listing)}</span>` : ''}
          ${ownerProfileLink(listing, 'owner owner-profile-link')}
          ${callLink}
          ${ownerChatButton(listing)}
          ${mapButton(listing)}
          ${shareButton(listing)}
        </div>
      </div>
    </article>
  `;
}

function recentItem(listing) {
  const title = escapeHtml(listing.title);
  const location = escapeHtml(listing.location);
  return `
    <article class="recent-item" data-detail-id="${listing._id}">
      <img src="${primaryImage(listing)}" alt="${title}">
      <div>
        <strong>${title}</strong>
        <span>${location}</span>
        <div class="price">${price(listing.price, listing.dealType)}</div>
        ${mapButton(listing)}
        ${shareButton(listing)}
      </div>
    </article>
  `;
}

function memberItem(listing) {
  const editable = listing.status !== 'pending';
  const title = escapeHtml(listing.title);
  const location = escapeHtml(listing.location);
  return `
    <article class="member-item" data-detail-id="${listing._id}">
      <img src="${primaryImage(listing)}" alt="${title}">
      <div>
        <strong>${title}</strong>
        <div class="muted">${location}</div>
        <div class="admin-meta">${statusLabel(listing.status)}</div>
        <div>${price(listing.price, listing.dealType)}</div>
        ${mapButton(listing)}
        ${shareButton(listing)}
      </div>
      <div class="member-item-actions">
        ${editable ? `<button class="icon-btn" type="button" data-edit="${listing._id}" aria-label="Modifier">
          <i data-lucide="pencil"></i>
        </button>` : ''}
        <button class="icon-btn" type="button" data-delete="${listing._id}" aria-label="Supprimer">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    </article>
  `;
}

function renderDashboardStats(listings) {
  const total = listings.length;
  const location = listings.filter((listing) => listing.dealType === 'location').length;
  const vente = listings.filter((listing) => listing.dealType === 'vente').length;
  const totalValue = listings.reduce((sum, listing) => sum + Number(listing.price || 0), 0);

  els.dashboardStats.innerHTML = `
    <div class="dashboard-stat"><strong>${total}</strong><span>${t('dashboard.total')}</span></div>
    <div class="dashboard-stat"><strong>${location}</strong><span>${t('common.locations')}</span></div>
    <div class="dashboard-stat"><strong>${vente}</strong><span>${t('common.sales')}</span></div>
    <div class="dashboard-stat"><strong>${new Intl.NumberFormat('fr-MG', { notation: 'compact' }).format(totalValue)}</strong><span>${t('dashboard.totalValue')}</span></div>
  `;
}

function openMemberProfile() {
  if (!state.user) return;

  const user = state.user;
  const agency = user.accountType === 'agence';
  const verified = user.role === 'admin' || user.identityVerified === true;
  const verificationStatus = user.identityVerification?.status || (verified ? 'approved' : 'none');
  const pendingVerification = verificationStatus === 'pending';
  const accountLabel = agency ? t('auth.accountAgency') : t('auth.accountPersonal');
  const listings = state.memberListingsData;
  const approved = listings.filter((listing) => listing.status === 'approved').length;
  const pending = listings.filter((listing) => listing.status === 'pending').length;
  const rejected = listings.filter((listing) => listing.status === 'rejected').length;

  els.memberProfileSubtitle.textContent = user.email;
  els.memberProfileContent.innerHTML = `
    <div class="admin-profile-identity">
      <div class="admin-profile-avatar"><i data-lucide="${agency ? 'building-2' : 'user'}"></i></div>
      <div>
        <strong>${user.name || user.email}</strong>
        <span>${user.reference || '-'}</span>
      </div>
    </div>
    <div class="admin-profile-grid">
      <div><span>${t('admin.role')}</span><strong>${user.role || 'user'}</strong></div>
      <div><span>${t('admin.accountStatus')}</span><strong>${accountLabel}</strong></div>
      <div><span>${t('verify.status')}</span><strong class="status-pill ${verified ? 'approved' : pendingVerification ? 'pending' : 'rejected'}">${verified ? t('admin.verified') : pendingVerification ? t('verify.pending') : t('admin.notVerified')}</strong></div>
      <div><span>${t('admin.createdAt')}</span><strong>${formatDateTime(user.createdAt)}</strong></div>
      <div><span>${t('admin.publications')}</span><strong>${listings.length}</strong></div>
    </div>
    ${verified ? '' : `
      <section class="admin-profile-section">
        <h4>${pendingVerification ? t('verify.pending') : t('admin.notVerified')}</h4>
        <p><i data-lucide="badge-alert"></i>${t('auth.verifyToPublish')}</p>
        ${pendingVerification ? '' : `<button class="primary-btn" type="button" data-verification-open><i data-lucide="badge-check"></i><span>${t('verify.open')}</span></button>`}
      </section>
    `}
    <section class="admin-profile-section">
      <h4>${t('admin.contact')}</h4>
      <p><i data-lucide="mail"></i>${user.email}</p>
      <p><i data-lucide="phone"></i>${user.phone || '-'}</p>
    </section>
    <section class="admin-profile-section">
      <h4>${t('admin.publications')}</h4>
      <div class="admin-profile-stats">
        <span class="status-pill approved">${t('admin.approved')} : ${approved}</span>
        <span class="status-pill pending">${t('admin.pending')} : ${pending}</span>
        <span class="status-pill rejected">${t('admin.rejected')} : ${rejected}</span>
      </div>
    </section>
  `;
  els.memberProfilePanel.hidden = false;
  icons();
}

function showHomePage() {
  els.profilePage.hidden = true;
  document.querySelector('.hero').hidden = false;
  document.querySelector('.page-shell').hidden = false;
}

function showProfilePage() {
  document.querySelector('.hero').hidden = true;
  document.querySelector('.page-shell').hidden = true;
  els.profilePage.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function publicProfileMarkup(data) {
  const user = data.user;
  const listings = data.listings || [];
  const agency = user.accountType === 'agence';
  const accountLabel = agency ? t('auth.accountAgency') : t('auth.accountPersonal');
  const name = escapeHtml(user.name || user.email);
  const email = escapeHtml(user.email);
  const phone = escapeHtml(user.phone || '-');
  const reference = escapeHtml(user.reference || '-');

  return `
    <div class="public-profile-hero">
      <div class="admin-profile-avatar"><i data-lucide="${agency ? 'building-2' : 'user'}"></i></div>
      <div>
        <p>${t('profile.title')}</p>
        <h1>${name}</h1>
        <div class="public-profile-meta">
          <span>${accountLabel}</span>
          <span>${t('admin.userReference')} : ${reference}</span>
          <span>${t('admin.publications')} : ${listings.length}</span>
        </div>
      </div>
    </div>
    <div class="public-profile-layout">
      <aside class="public-profile-card">
        <h2>${t('admin.contact')}</h2>
        <p><i data-lucide="mail"></i>${email}</p>
        <p><i data-lucide="phone"></i>${phone}</p>
        <p><i data-lucide="calendar"></i>${t('admin.createdAt')} : ${formatDate(user.createdAt)}</p>
      </aside>
      <section>
        <div class="section-title">
          <div>
            <h2>${t('profile.listings')}</h2>
            <span>${listings.length} ${t('common.listings')}</span>
          </div>
        </div>
        <div class="listings-grid public-profile-listings">
          ${listings.length ? listings.map(listingCard).join('') : `<div class="empty">${t('profile.empty')}</div>`}
        </div>
      </section>
    </div>
  `;
}

async function loadPublicProfile(userId) {
  showProfilePage();
  els.profilePageContent.innerHTML = `<div class="empty">${t('empty.loading')}</div>`;
  try {
    const data = await api(`/api/listings/profiles/${userId}`);
    state.profileListingsData = data.listings || [];
    els.profilePageContent.innerHTML = publicProfileMarkup(data);
    icons();
  } catch (error) {
    els.profilePageContent.innerHTML = `<div class="empty">${error.message}</div>`;
  }
}

function handleRoute() {
  const profileMatch = window.location.hash.match(/^#profile\/(.+)$/);
  if (profileMatch) {
    loadPublicProfile(profileMatch[1]);
    return;
  }

  const listingMatch = window.location.hash.match(/^#listing\/(.+)$/);
  if (listingMatch) {
    showHomePage();
    loadSharedListing(listingMatch[1]);
  } else {
    showHomePage();
  }
}

function renderMemberListings() {
  const filtered = state.dashboardFilter === 'all'
    ? state.memberListingsData
    : state.memberListingsData.filter((listing) => listing.dealType === state.dashboardFilter);
  const approved = filtered.filter((listing) => listing.status === 'approved');
  const pending = filtered.filter((listing) => listing.status === 'pending');
  const rejected = filtered.filter((listing) => listing.status === 'rejected');

  renderDashboardStats(state.memberListingsData);
  if (!state.memberListingsData.length) {
    els.memberListings.innerHTML = `<div class="empty">${t('empty.noMemberListing')}</div>`;
  } else {
    els.memberListings.innerHTML = filtered.length
      ? `
        <section class="member-status-group">
          <h4>${t('admin.approved')}</h4>
          ${approved.length ? approved.map(memberItem).join('') : `<div class="empty">${t('empty.noCategory')}</div>`}
        </section>
        <section class="member-status-group">
          <h4>${t('admin.pending')}</h4>
          ${pending.length ? pending.map(memberItem).join('') : `<div class="empty">${t('empty.noCategory')}</div>`}
        </section>
        ${rejected.length ? `
          <section class="member-status-group">
            <h4>${t('admin.rejected')}</h4>
            ${rejected.map(memberItem).join('')}
          </section>
        ` : ''}
      `
      : `<div class="empty">${t('empty.noCategory')}</div>`;
  }
  icons();
}

function statusLabel(status) {
  return t(`admin.${status || 'pending'}`);
}

function statusClass(status) {
  return ['approved', 'rejected', 'pending'].includes(status) ? status : 'pending';
}

function formatDate(value) {
  if (!value) return '-';
  const locale = state.lang === 'en' ? 'en-US' : state.lang === 'mg' ? 'fr-MG' : 'fr-FR';
  return new Intl.DateTimeFormat(locale).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return '-';
  const locale = state.lang === 'en' ? 'en-US' : state.lang === 'mg' ? 'fr-MG' : 'fr-FR';
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

function activityLabel(activity) {
  const labels = {
    'auth.register': 'Création du compte',
    'auth.login': 'Connexion',
    'auth.logout': 'Déconnexion',
    'listing.create': 'Publication d’une annonce',
    'listing.update': 'Modification d’une annonce',
    'listing.delete': 'Suppression d’une annonce',
    'admin.user_update': 'Modification du compte par admin',
    'admin.listing_moderation': 'Modération d’une annonce',
    'admin.listing_featured': 'Mise à jour mise en avant',
    'admin.listing_delete': 'Suppression d’une annonce par admin'
  };
  return activity.label || labels[activity.type] || activity.type;
}

function closeAdminActivity() {
  els.adminActivityPanel.hidden = true;
  els.adminActivityList.innerHTML = '';
}

function closeAdminProfile() {
  els.adminProfilePanel.hidden = true;
  els.adminProfileContent.innerHTML = '';
}

async function openAdminActivity(userId) {
  const user = state.adminUsersData.find((item) => String(item._id) === String(userId));
  closeAdminProfile();
  els.adminActivityUser.textContent = user ? `${user.name || user.email} - ${user.email}` : '';
  els.adminActivityList.innerHTML = `<div class="empty">${t('empty.loading')}</div>`;
  els.adminActivityPanel.hidden = false;
  icons();

  const activities = await api(`/api/admin/users/${userId}/activities?limit=80`, { headers: headers() });
  els.adminActivityList.innerHTML = activities.length
    ? activities.map((activity) => `
      <article class="admin-activity-item">
        <div class="admin-activity-icon"><i data-lucide="clock-3"></i></div>
        <div>
          <strong>${activityLabel(activity)}</strong>
          <span>${formatDateTime(activity.createdAt)}</span>
        </div>
      </article>
    `).join('')
    : `<div class="empty">${t('admin.historyEmpty')}</div>`;
  icons();
}

function userListings(user) {
  return state.adminListingsData.filter((listing) => String(listing.ownerId) === String(user._id));
}

function openAdminProfile(userId) {
  const user = state.adminUsersData.find((item) => String(item._id) === String(userId));
  if (!user) return;

  closeAdminActivity();
  const agency = user.accountType === 'agence';
  const admin = user.role === 'admin';
  const verified = admin || user.identityVerified === true;
  const verification = user.identityVerification || {};
  const accountLabel = agency ? t('auth.accountAgency') : t('auth.accountPersonal');
  const listings = userListings(user);
  const approved = listings.filter((listing) => listing.status === 'approved').length;
  const pending = listings.filter((listing) => listing.status === 'pending').length;
  const rejected = listings.filter((listing) => listing.status === 'rejected').length;

  els.adminProfileSubtitle.textContent = user.email;
  els.adminProfileContent.innerHTML = `
    <div class="admin-profile-identity">
      <div class="admin-profile-avatar"><i data-lucide="${agency ? 'building-2' : 'user'}"></i></div>
      <div>
        <strong>${user.name || user.email}</strong>
        <span>${user.reference || '-'}</span>
      </div>
    </div>
    <div class="admin-profile-grid">
      <div><span>${t('admin.role')}</span><strong>${admin ? 'admin' : 'user'}</strong></div>
      <div><span>${t('admin.accountStatus')}</span><strong>${accountLabel}</strong></div>
      <div><span>${t('admin.verifyIdentity')}</span><strong>${verified ? t('admin.verified') : t('admin.notVerified')}</strong></div>
      <div><span>${t('admin.createdAt')}</span><strong>${formatDateTime(user.createdAt)}</strong></div>
      <div><span>${t('admin.publications')}</span><strong>${listings.length}</strong></div>
    </div>
    <section class="admin-profile-section">
      <h4>${t('admin.contact')}</h4>
      <p><i data-lucide="mail"></i>${user.email}</p>
      <p><i data-lucide="phone"></i>${user.phone || '-'}</p>
    </section>
    <section class="admin-profile-section">
      <h4>${t('verify.status')}</h4>
      <p><i data-lucide="badge-check"></i>${verified ? t('admin.verified') : verification.status === 'pending' ? t('verify.pending') : t('admin.notVerified')}</p>
      ${verification.fullName ? `<p><i data-lucide="user"></i>${verification.fullName}</p>` : ''}
      ${verification.documentType ? `<p><i data-lucide="file-badge"></i>${verification.documentType}</p>` : ''}
      ${verification.note ? `<p><i data-lucide="message-square"></i>${verification.note}</p>` : ''}
      ${(verification.documents || []).map((document) => `<p><i data-lucide="paperclip"></i><a href="${document.url}" target="_blank" rel="noreferrer">${document.name || document.url}</a></p>`).join('')}
    </section>
    <section class="admin-profile-section">
      <h4>${t('admin.publications')}</h4>
      <div class="admin-profile-stats">
        <span class="status-pill approved">${t('admin.approved')} : ${approved}</span>
        <span class="status-pill pending">${t('admin.pending')} : ${pending}</span>
        <span class="status-pill rejected">${t('admin.rejected')} : ${rejected}</span>
      </div>
    </section>
    <button class="ghost-btn panel-btn" type="button" data-admin-activity="${user._id}">
      <i data-lucide="history"></i><span>${t('admin.history')}</span>
    </button>
    <button class="ghost-btn panel-btn" type="button" data-admin-message="${user._id}">
      <i data-lucide="send"></i><span>${t('notifications.message')}</span>
    </button>
  `;
  els.adminProfilePanel.hidden = false;
  icons();
}

function renderAdminStats() {
  const pending = state.adminListingsData.filter((listing) => listing.status === 'pending').length;
  const approved = state.adminListingsData.filter((listing) => listing.status === 'approved').length;
  const admins = state.adminUsersData.filter((user) => user.role === 'admin').length;

  els.adminStats.innerHTML = `
    <div class="admin-stat"><strong>${state.adminListingsData.length}</strong><span>${t('admin.totalListings')}</span></div>
    <div class="admin-stat warning"><strong>${pending}</strong><span>${t('admin.waiting')}</span></div>
    <div class="admin-stat"><strong>${state.adminUsersData.length}</strong><span>${t('admin.totalUsers')}</span></div>
    <div class="admin-stat"><strong>${admins}</strong><span>${t('admin.admins')}</span></div>
  `;
  return { pending, approved };
}

function adminListingItem(listing) {
  const approved = listing.status === 'approved';
  const rejected = listing.status === 'rejected';
  return `
    <article class="admin-row" data-detail-id="${listing._id}">
      <img class="admin-row-image" src="${primaryImage(listing)}" alt="${listing.title}">
      <div class="admin-row-main">
        <div class="admin-row-head">
          <strong>${listing.title}</strong>
          <span class="status-pill ${statusClass(listing.status)}">${statusLabel(listing.status)}</span>
        </div>
        <div class="admin-row-meta">
          <span><i data-lucide="star"></i>${listing.featured ? t('admin.featured') : t('admin.notFeatured')}</span>
          <span><i data-lucide="map-pin"></i>${listing.location}</span>
          <span><i data-lucide="user"></i>${t('admin.owner')} : ${listing.ownerName || 'MaisonMada'}</span>
          <span><i data-lucide="calendar"></i>${formatDate(listing.createdAt)}</span>
        </div>
        ${listing.moderationReason ? `<div class="admin-meta">${t('admin.refusalReason')} : ${listing.moderationReason}</div>` : ''}
      </div>
      <div class="admin-row-price">${price(listing.price, listing.dealType)}</div>
      <div class="admin-actions">
        <button class="icon-btn featured-toggle ${listing.featured ? 'active' : ''}" type="button" data-admin-featured="${listing._id}" data-featured="${listing.featured ? 'false' : 'true'}" ${!approved && !listing.featured ? 'disabled' : ''} aria-label="${listing.featured ? t('actions.unfeature') : t('actions.feature')}" title="${listing.featured ? t('actions.unfeature') : t('actions.feature')}"><i data-lucide="star"></i></button>
        <button class="icon-btn" type="button" data-admin-approve="${listing._id}" ${approved ? 'disabled' : ''} aria-label="${t('actions.approve')}" title="${t('actions.approve')}"><i data-lucide="check"></i></button>
        <button class="icon-btn" type="button" data-admin-reject="${listing._id}" ${rejected ? 'disabled' : ''} aria-label="${t('actions.reject')}" title="${t('actions.reject')}"><i data-lucide="x"></i></button>
        <button class="icon-btn danger" type="button" data-admin-delete-listing="${listing._id}" aria-label="${t('actions.delete')}"><i data-lucide="trash-2"></i></button>
      </div>
    </article>
  `;
}

function adminListingSimpleItem(listing) {
  const approved = listing.status === 'approved';
  const rejected = listing.status === 'rejected';
  return `
    <article class="member-item admin-simple-item" data-detail-id="${listing._id}">
      <img src="${primaryImage(listing)}" alt="${listing.title}">
      <div>
        <strong>${listing.title}</strong>
        <div class="muted">${listing.location}</div>
        <div class="admin-meta">${t('admin.owner')} : ${listing.ownerName || 'MaisonMada'}</div>
        <div>${price(listing.price, listing.dealType)}</div>
        ${listing.moderationReason ? `<div class="admin-meta">${t('admin.refusalReason')} : ${listing.moderationReason}</div>` : ''}
      </div>
      <div class="admin-actions admin-simple-actions">
        <button class="icon-btn featured-toggle ${listing.featured ? 'active' : ''}" type="button" data-admin-featured="${listing._id}" data-featured="${listing.featured ? 'false' : 'true'}" ${!approved && !listing.featured ? 'disabled' : ''} aria-label="${listing.featured ? t('actions.unfeature') : t('actions.feature')}" title="${listing.featured ? t('actions.unfeature') : t('actions.feature')}"><i data-lucide="star"></i></button>
        <button class="icon-btn" type="button" data-admin-approve="${listing._id}" ${approved ? 'disabled' : ''} aria-label="${t('actions.approve')}" title="${t('actions.approve')}"><i data-lucide="check"></i></button>
        <button class="icon-btn" type="button" data-admin-reject="${listing._id}" ${rejected ? 'disabled' : ''} aria-label="${t('actions.reject')}" title="${t('actions.reject')}"><i data-lucide="x"></i></button>
        <button class="icon-btn danger" type="button" data-admin-delete-listing="${listing._id}" aria-label="${t('actions.delete')}"><i data-lucide="trash-2"></i></button>
      </div>
    </article>
  `;
}

function adminListingTableRow(listing) {
  const approved = listing.status === 'approved';
  const rejected = listing.status === 'rejected';
  return `
    <tr data-detail-id="${listing._id}">
      <td>
        <div class="admin-table-title">
          <img src="${primaryImage(listing)}" alt="${listing.title}">
          <span><strong>${listing.title}</strong><small>${listing.location || '-'}</small></span>
        </div>
      </td>
      <td><span class="status-pill ${statusClass(listing.status)}">${statusLabel(listing.status)}</span></td>
      <td>${listing.ownerName || 'MaisonMada'}</td>
      <td>${listing.location}</td>
      <td>${price(listing.price, listing.dealType)}</td>
      <td>${formatDate(listing.createdAt)}</td>
      <td>
        <div class="admin-actions admin-table-actions">
          <button class="icon-btn featured-toggle ${listing.featured ? 'active' : ''}" type="button" data-admin-featured="${listing._id}" data-featured="${listing.featured ? 'false' : 'true'}" ${!approved && !listing.featured ? 'disabled' : ''} aria-label="${listing.featured ? t('actions.unfeature') : t('actions.feature')}" title="${listing.featured ? t('actions.unfeature') : t('actions.feature')}"><i data-lucide="star"></i></button>
          <button class="icon-btn" type="button" data-admin-approve="${listing._id}" ${approved ? 'disabled' : ''} aria-label="${t('actions.approve')}" title="${t('actions.approve')}"><i data-lucide="check"></i></button>
          <button class="icon-btn" type="button" data-admin-reject="${listing._id}" ${rejected ? 'disabled' : ''} aria-label="${t('actions.reject')}" title="${t('actions.reject')}"><i data-lucide="x"></i></button>
          <button class="icon-btn danger" type="button" data-admin-delete-listing="${listing._id}" aria-label="${t('actions.delete')}"><i data-lucide="trash-2"></i></button>
        </div>
      </td>
    </tr>
  `;
}

function adminUserItem(user) {
  const admin = user.role === 'admin';
  const agency = user.accountType === 'agence';
  const verified = admin || user.identityVerified === true;
  const accountLabel = agency ? t('auth.accountAgency') : t('auth.accountPersonal');
  return `
    <article class="admin-row user-row">
      <div class="admin-avatar"><i data-lucide="user"></i></div>
      <div class="admin-row-main">
        <div class="admin-row-head">
          <button class="admin-profile-link" type="button" data-admin-profile="${user._id}" title="${t('admin.profileOpen')}">${user.name || user.email}</button>
          <span class="status-pill ${admin ? 'approved' : 'pending'}">${admin ? 'admin' : 'user'}</span>
          <span class="status-pill ${verified ? 'approved' : 'rejected'}">${verified ? t('admin.verified') : t('admin.notVerified')}</span>
          <span class="account-status-pill ${agency ? 'agency' : 'personal'}">${t('admin.accountStatus')} : ${accountLabel}</span>
        </div>
        <div class="admin-row-meta">
          <span><i data-lucide="badge"></i>${t('admin.userReference')} : ${user.reference || '-'}</span>
          <span><i data-lucide="mail"></i>${user.email}</span>
          <span><i data-lucide="phone"></i>${user.phone || '-'}</span>
          <span><i data-lucide="briefcase-business"></i>${t('admin.accountStatus')} : ${accountLabel}</span>
          <span><i data-lucide="${verified ? 'badge-check' : 'badge-alert'}"></i>${verified ? t('admin.verified') : t('admin.notVerified')}</span>
          <span><i data-lucide="calendar"></i>${formatDate(user.createdAt)}</span>
        </div>
      </div>
      <div class="admin-row-price">${t('admin.role')} : ${admin ? 'admin' : 'user'}</div>
      <div class="admin-actions">
        <button class="ghost-btn panel-btn" type="button" data-admin-activity="${user._id}">
          <i data-lucide="history"></i><span>${t('admin.history')}</span>
        </button>
        <button class="ghost-btn panel-btn" type="button" data-admin-message="${user._id}">
          <i data-lucide="send"></i><span>${t('notifications.message')}</span>
        </button>
        ${admin ? `<span class="admin-protected"><i data-lucide="lock"></i>${t('admin.protected')}</span>` : `
          <button class="ghost-btn panel-btn" type="button" data-admin-role="${user._id}" data-role="admin">
            <i data-lucide="shield-plus"></i><span>${t('admin.makeAdmin')}</span>
          </button>
          <button class="ghost-btn panel-btn" type="button" data-admin-account="${user._id}" data-account-type="${agency ? 'particulier' : 'agence'}">
            <i data-lucide="${agency ? 'user-round' : 'building-2'}"></i><span>${agency ? t('admin.makePersonal') : t('admin.makeAgency')}</span>
          </button>
          <button class="ghost-btn panel-btn" type="button" data-admin-verify="${user._id}" data-verified="${verified ? 'false' : 'true'}">
            <i data-lucide="${verified ? 'badge-x' : 'badge-check'}"></i><span>${verified ? t('admin.unverifyIdentity') : t('admin.verifyIdentity')}</span>
          </button>
          <button class="icon-btn danger" type="button" data-admin-delete-user="${user._id}" aria-label="${t('actions.delete')}">
            <i data-lucide="trash-2"></i>
          </button>
        `}
      </div>
    </article>
  `;
}

function adminUserTableRow(user) {
  const admin = user.role === 'admin';
  const agency = user.accountType === 'agence';
  const verified = admin || user.identityVerified === true;
  const accountLabel = agency ? t('auth.accountAgency') : t('auth.accountPersonal');
  return `
    <tr>
      <td>
        <div class="admin-table-title">
          <span class="admin-table-avatar"><i data-lucide="user"></i></span>
          <span><button class="admin-profile-link" type="button" data-admin-profile="${user._id}" title="${t('admin.profileOpen')}">${user.name || user.email}</button><small>${user.reference || '-'}</small></span>
        </div>
      </td>
      <td><span class="status-pill ${admin ? 'approved' : 'pending'}">${admin ? 'admin' : 'user'}</span></td>
      <td>${user.email}</td>
      <td>${user.phone || '-'}</td>
      <td><span class="account-status-pill ${agency ? 'agency' : 'personal'}">${accountLabel}</span><span class="status-pill ${verified ? 'approved' : 'rejected'}">${verified ? t('admin.verified') : t('admin.notVerified')}</span></td>
      <td>${formatDate(user.createdAt)}</td>
      <td>
        <div class="admin-actions admin-table-actions user-table-actions compact-admin-actions">
          <button class="icon-btn" type="button" data-admin-activity="${user._id}" aria-label="${t('admin.history')}" title="${t('admin.history')}">
            <i data-lucide="history"></i>
          </button>
          <button class="icon-btn" type="button" data-admin-message="${user._id}" aria-label="${t('notifications.message')}" title="${t('notifications.message')}">
            <i data-lucide="send"></i>
          </button>
          ${admin ? `<span class="admin-protected"><i data-lucide="lock"></i>${t('admin.protected')}</span>` : `
            <button class="icon-btn" type="button" data-admin-role="${user._id}" data-role="admin" aria-label="${t('admin.makeAdmin')}" title="${t('admin.makeAdmin')}">
              <i data-lucide="shield-plus"></i>
            </button>
            <button class="icon-btn" type="button" data-admin-account="${user._id}" data-account-type="${agency ? 'particulier' : 'agence'}" aria-label="${agency ? t('admin.makePersonal') : t('admin.makeAgency')}" title="${agency ? t('admin.makePersonal') : t('admin.makeAgency')}">
              <i data-lucide="${agency ? 'user-round' : 'building-2'}"></i>
            </button>
            <button class="icon-btn" type="button" data-admin-verify="${user._id}" data-verified="${verified ? 'false' : 'true'}" aria-label="${verified ? t('admin.unverifyIdentity') : t('admin.verifyIdentity')}" title="${verified ? t('admin.unverifyIdentity') : t('admin.verifyIdentity')}">
              <i data-lucide="${verified ? 'badge-x' : 'badge-check'}"></i>
            </button>
            <button class="icon-btn danger" type="button" data-admin-delete-user="${user._id}" aria-label="${t('actions.delete')}">
              <i data-lucide="trash-2"></i>
            </button>
          `}
        </div>
      </td>
    </tr>
  `;
}

function adminViewSwitcher() {
  return `
    <div class="admin-view-switch" role="group" aria-label="Vue admin">
      <button type="button" data-admin-view="table" class="${state.adminView === 'table' ? 'active' : ''}" aria-label="${t('admin.tableView')}" title="${t('admin.tableView')}"><i data-lucide="table-2"></i><span>${t('admin.tableView')}</span></button>
      <button type="button" data-admin-view="simple" class="${state.adminView === 'simple' ? 'active' : ''}" aria-label="${t('admin.simpleView')}" title="${t('admin.simpleView')}"><i data-lucide="layout-list"></i><span>${t('admin.simpleView')}</span></button>
    </div>
  `;
}

function adminListingsSimple() {
  const approved = state.adminListingsData.filter((listing) => listing.status === 'approved');
  const pending = state.adminListingsData.filter((listing) => listing.status === 'pending');
  const rejected = state.adminListingsData.filter((listing) => listing.status === 'rejected');
  return `
    <section class="member-status-group">
      <h4>${t('admin.pending')}</h4>
      ${pending.length ? pending.map(adminListingSimpleItem).join('') : `<div class="empty">${t('empty.noCategory')}</div>`}
    </section>
    <section class="member-status-group">
      <h4>${t('admin.approved')}</h4>
      ${approved.length ? approved.map(adminListingSimpleItem).join('') : `<div class="empty">${t('empty.noCategory')}</div>`}
    </section>
    ${rejected.length ? `
      <section class="member-status-group">
        <h4>${t('admin.rejected')}</h4>
        ${rejected.map(adminListingSimpleItem).join('')}
      </section>
    ` : ''}
  `;
}

function renderAdmin() {
  const listingsActive = state.adminTab === 'listings';
  renderAdminStats();
  els.adminListings.hidden = !listingsActive;
  els.adminUsers.hidden = listingsActive;
  els.adminSectionTitle.textContent = listingsActive ? t('admin.listings') : t('admin.users');
  document.querySelectorAll('[data-admin-tab]').forEach((button) => {
    button.classList.toggle('active', button.dataset.adminTab === state.adminTab);
  });

  els.adminListings.innerHTML = state.adminListingsData.length
    ? state.adminView === 'table' ? `
      ${adminViewSwitcher()}
      <div class="admin-table-scroll">
        <table class="admin-data-table admin-users-data-table">
          <thead>
            <tr>
              <th>${t('admin.listings')}</th>
              <th>${t('admin.status')}</th>
              <th>${t('admin.owner')}</th>
              <th>${t('listing.location')}</th>
              <th>${t('listing.price')}</th>
              <th>${t('admin.createdAt')}</th>
              <th>${t('admin.actions')}</th>
            </tr>
          </thead>
          <tbody>${state.adminListingsData.map(adminListingTableRow).join('')}</tbody>
        </table>
      </div>
    ` : `
      ${adminViewSwitcher()}
      <div class="admin-list-head">
        <span>${t('admin.listings')}</span>
        <span>${t('listing.price')}</span>
        <span>${t('admin.actions')}</span>
      </div>
      ${adminListingsSimple()}
    `
    : `${adminViewSwitcher()}<div class="empty">${t('empty.noListing')}</div>`;

  els.adminUsers.innerHTML = state.adminUsersData.length
    ? state.adminView === 'table' ? `
      ${adminViewSwitcher()}
      <div class="admin-table-scroll">
        <table class="admin-data-table">
          <thead>
            <tr>
              <th>${t('admin.users')}</th>
              <th>${t('admin.role')}</th>
              <th>Email</th>
              <th>${t('auth.phone')}</th>
              <th>${t('admin.accountStatus')}</th>
              <th>${t('admin.createdAt')}</th>
              <th>${t('admin.actions')}</th>
            </tr>
          </thead>
          <tbody>${state.adminUsersData.map(adminUserTableRow).join('')}</tbody>
        </table>
      </div>
    ` : `
      ${adminViewSwitcher()}
      <div class="admin-list-head">
        <span>${t('admin.users')}</span>
        <span>${t('admin.role')}</span>
        <span>${t('admin.actions')}</span>
      </div>
      ${state.adminUsersData.map(adminUserItem).join('')}
    `
    : `${adminViewSwitcher()}<div class="empty">${t('empty.noListing')}</div>`;

  icons();
}

async function loadStats() {
  const data = await api('/api/stats');
  els.stats.innerHTML = stats.map(([key, label, icon]) => `
    <button class="stat-card" type="button" data-stat="${key}">
      <i data-lucide="${icon}"></i>
      <span><strong>${t(label)}</strong><span>${data[key] || 0} ${t('common.listings')}</span></span>
    </button>
  `).join('');
  icons();
}

async function loadAdminData() {
  const [listings, users] = await Promise.all([
    api('/api/admin/listings?limit=100', { headers: headers() }),
    api('/api/admin/users', { headers: headers() })
  ]);
  state.adminListingsData = listings;
  state.adminUsersData = users;
  renderAdmin();
}

async function loadListings(params = new URLSearchParams([['featured', 'true']])) {
  els.listings.innerHTML = `<div class="empty">${t('empty.loading')}</div>`;
  const data = await api(`/api/listings?${params.toString()}`);
  state.listingsData = data;
  els.listings.innerHTML = data.length
    ? `
      <button class="carousel-btn prev" type="button" data-carousel="prev" aria-label="Précédent"><i data-lucide="chevron-left"></i></button>
      <div class="listings-track">
        ${data.map(listingCard).join('')}
      </div>
      <button class="carousel-btn next" type="button" data-carousel="next" aria-label="Suivant"><i data-lucide="chevron-right"></i></button>
    `
    : `<div class="empty">${t('empty.noListing')}</div>`;
  icons();
}

async function loadOtherListings(params = new URLSearchParams(), options = {}) {
  els.otherListings.innerHTML = `<div class="empty">${t('empty.loading')}</div>`;
  const data = await api(`/api/listings?${params.toString()}`);
  const listings = options.includeFeatured ? data : data.filter((listing) => !listing.featured);
  state.otherListingsData = listings;
  els.otherListings.innerHTML = listings.length
    ? listings.map(listingCard).join('')
    : `<div class="empty">${t('empty.noListing')}</div>`;
  icons();
}

async function loadRecent() {
  const data = await api('/api/listings?limit=3');
  state.recentListingsData = data;
  els.recent.innerHTML = data.map(recentItem).join('');
  icons();
}

async function loadMemberListings() {
  els.memberListings.innerHTML = `<div class="empty">${t('empty.loading')}</div>`;
  const data = await api('/api/listings/mine', { headers: headers() });
  state.memberListingsData = data;
  renderMemberListings();
}

function connectChatSocket() {
  if (!state.token || state.socket || typeof io === 'undefined') return;

  state.socket = io({ auth: { token: state.token } });
  state.socket.on('connect', () => renderChatConnection());
  state.socket.on('disconnect', () => renderChatConnection());
  state.socket.on('connect_error', (error) => {
    renderChatConnection();
    if (els.chatDrawer && !els.chatDrawer.hidden) toast(error.message);
  });
  state.socket.on('chat:message', (message) => {
    const active = String(message.conversationId) === String(state.activeConversationId) && !els.chatDrawer.hidden;
    const mine = String(message.senderId) === String(state.user?._id);

    if (!mine && !active) {
      state.unreadChatConversations.add(String(message.conversationId));
      renderChatUnreadState();
      toast(t('chat.newMessage'));
    }

    if (String(message.conversationId) === String(state.activeConversationId)) {
      if (!state.chatMessages.some((item) => String(item._id) === String(message._id))) {
        state.chatMessages.push(message);
      }
      renderChatMessages();
    }
    loadChatConversations().catch(() => {});
  });
}

function disconnectChatSocket() {
  if (!state.socket) return;
  state.socket.removeAllListeners();
  state.socket.disconnect();
  state.socket = null;
}

function renderChatConnection() {
  if (!els.chatConnectionStatus) return;
  const connected = Boolean(state.socket?.connected);
  els.chatConnectionStatus.textContent = connected ? t('chat.connected') : t('chat.offline');
  els.chatConnectionStatus.className = connected ? 'online' : '';
}

function renderChatUnreadState() {
  const unread = state.unreadChatConversations.size > 0;
  els.chatOpenButton.classList.toggle('has-unread', unread);
  els.chatOpenButton.dataset.unreadCount = unread ? String(state.unreadChatConversations.size) : '';
  els.chatOpenButton.setAttribute('aria-label', unread ? `${t('chat.title')} - nouveau message` : t('chat.title'));
  renderChatQuickConversations();
}

function isUnreadConversation(conversation) {
  if (String(conversation.lastSenderId || '') === String(state.user?._id)) return false;
  if (state.user?.role === 'admin' && conversation.type === 'support' && conversation.lastSenderRole === 'admin') return false;
  return Boolean(conversation.unread);
}

function conversationTitle(conversation) {
  if (conversation.type === 'support') {
    const user = conversation.participants?.find((participant) => participant.role !== 'admin');
    return state.user?.role === 'admin' && user ? `${t('chat.supportLabel')} - ${user.name}` : t('chat.supportLabel');
  }

  const other = conversation.participants?.find((participant) => String(participant._id) !== String(state.user?._id));
  return other?.name || t('chat.directLabel');
}

function renderChatConversations() {
  els.chatConversations.innerHTML = state.chatConversations.length
    ? state.chatConversations.map((conversation) => `
      <button class="${[
        String(conversation._id) === String(state.activeConversationId) ? 'active' : '',
        state.unreadChatConversations.has(String(conversation._id)) ? 'has-unread' : ''
      ].filter(Boolean).join(' ')}" type="button" data-chat-conversation="${conversation._id}">
        <strong>${escapeHtml(conversationTitle(conversation))}</strong>
        <span>${escapeHtml(conversation.lastMessage || t(conversation.type === 'support' ? 'chat.supportLabel' : 'chat.directLabel'))}</span>
      </button>
    `).join('')
    : `<div class="empty">${t('chat.noConversation')}</div>`;
  icons();
}

function closeChatQuickPanel() {
  if (els.chatQuickPanel) els.chatQuickPanel.hidden = true;
}

function closeNotificationsQuickPanel() {
  if (els.notificationsQuickPanel) els.notificationsQuickPanel.hidden = true;
}

function conversationInitials(conversation) {
  return conversationTitle(conversation)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('') || 'M';
}

function renderChatQuickConversations() {
  if (!els.chatQuickList) return;
  const query = (els.chatQuickSearch?.value || '').trim().toLowerCase();
  const conversations = state.chatConversations.filter((conversation) => {
    const unread = state.unreadChatConversations.has(String(conversation._id));
    const title = conversationTitle(conversation).toLowerCase();
    const message = String(conversation.lastMessage || '').toLowerCase();
    if (state.chatQuickFilter === 'unread' && !unread) return false;
    return !query || title.includes(query) || message.includes(query);
  });

  els.chatQuickList.innerHTML = conversations.length
    ? conversations.map((conversation) => {
      const unread = state.unreadChatConversations.has(String(conversation._id));
      return `
        <button class="popover-item ${unread ? 'unread' : ''}" type="button" data-chat-quick="${conversation._id}">
          <span class="popover-avatar">${escapeHtml(conversationInitials(conversation))}</span>
          <span class="popover-copy">
            <strong>${escapeHtml(conversationTitle(conversation))}</strong>
            <span>${escapeHtml(conversation.lastMessage || t(conversation.type === 'support' ? 'chat.supportLabel' : 'chat.directLabel'))}</span>
          </span>
          ${unread ? '<span class="popover-dot"></span>' : ''}
        </button>
      `;
    }).join('')
    : `<div class="empty">${t('chat.noConversation')}</div>`;
  icons();
}

function renderChatMessages() {
  els.chatMessages.innerHTML = state.chatMessages.length
    ? state.chatMessages.map((message) => `
      <div class="chat-message ${String(message.senderId) === String(state.user?._id) ? 'mine' : ''}">
        <span>${message.senderName || ''}</span>
        <p>${escapeHtml(message.body || '')}</p>
      </div>
    `).join('')
    : `<div class="empty">${t('chat.pickConversation')}</div>`;
  els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));
}

async function loadChatConversations() {
  if (!state.user) return;
  state.chatConversations = await api('/api/chat/conversations', { headers: headers() });
  state.chatConversations.forEach((conversation) => {
    const active = String(conversation._id) === String(state.activeConversationId) && !els.chatDrawer.hidden;
    const unread = isUnreadConversation(conversation);
    if (unread && !active) {
      state.unreadChatConversations.add(String(conversation._id));
    } else if (!unread || active) {
      state.unreadChatConversations.delete(String(conversation._id));
    }
  });
  renderChatUnreadState();
  renderChatConversations();
}

async function openChat() {
  if (!state.user) {
    openAuth('member');
    return;
  }

  closeChatQuickPanel();
  closeNotificationsQuickPanel();
  connectChatSocket();
  els.chatDrawer.hidden = false;
  renderChatConnection();
  await loadChatConversations();
}

async function openChatQuickPanel() {
  if (!state.user) {
    openAuth('member');
    return;
  }

  closeNotificationsQuickPanel();
  els.chatQuickPanel.hidden = !els.chatQuickPanel.hidden;
  if (els.chatQuickPanel.hidden) return;
  connectChatSocket();
  els.chatQuickList.innerHTML = `<div class="empty">${t('empty.loading')}</div>`;
  await loadChatConversations();
  els.chatQuickSearch?.focus();
}

function closeChat() {
  els.chatDrawer.hidden = true;
}

function resetChatState() {
  state.chatConversations = [];
  state.chatMessages = [];
  state.unreadChatConversations.clear();
  state.activeConversationId = '';
  if (els.chatConversations) els.chatConversations.innerHTML = '';
  if (els.chatMessages) els.chatMessages.innerHTML = '';
  if (els.chatQuickList) els.chatQuickList.innerHTML = '';
  if (els.chatThreadTitle) els.chatThreadTitle.textContent = t('chat.pickConversation');
  renderChatUnreadState();
  renderChatConnection();
}

async function openConversation(conversation) {
  state.activeConversationId = String(conversation._id);
  state.unreadChatConversations.delete(String(conversation._id));
  renderChatUnreadState();
  els.chatThreadTitle.textContent = conversationTitle(conversation);
  state.chatMessages = await api(`/api/chat/conversations/${conversation._id}/messages`, { headers: headers() });
  renderChatConversations();
  renderChatMessages();
  connectChatSocket();
  state.socket?.emit('chat:join', { conversationId: conversation._id }, (response) => {
    if (!response?.ok) toast(response?.message || 'Conversation indisponible');
  });
}

async function startSupportChat() {
  await openChat();
  if (!state.user) return;
  if (state.user.role === 'admin') {
    await loadChatConversations();
    return;
  }

  const conversation = await api('/api/chat/support', {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  await loadChatConversations();
  await openConversation(conversation);
}

async function startDirectChat(recipientId, listingId) {
  await openChat();
  if (!state.user) return;
  const conversation = await api('/api/chat/direct', {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipientId, listingId })
  });
  await loadChatConversations();
  await openConversation(conversation);
}

function searchParams() {
  const form = new FormData(els.search);
  const params = new URLSearchParams();

  for (const [key, value] of form.entries()) {
    if (value && value !== 'all') params.set(key, value);
  }

  return params;
}

function listingFormData(form, options = {}) {
  const fileInput = form.elements.image;
  const filesCount = fileInput.files.length;

  if (fileInput.files.length > 5) {
    throw new Error(t('listing.maxPhotos'));
  }

  if (options.requireImages && filesCount < 3) {
    throw new Error(t('listing.photoRange'));
  }

  if (!options.requireImages && filesCount > 0 && filesCount < 3) {
    throw new Error(t('listing.minPhotos'));
  }

  const mapUrl = String(form.elements.mapUrl?.value || '').trim();
  if (options.requireMapUrl && !mapUrl) {
    throw new Error(t('listing.mapUrlRequired'));
  }

  if (mapUrl && !isGoogleMapsUrl(mapUrl)) {
    throw new Error(t('listing.mapUrlInvalid'));
  }

  const data = new FormData(form);
  if (!isAgencyAccount()) {
    data.set('dealType', 'location');
    data.set('propertyType', 'maison');
  }

  if (form.elements.area.disabled) {
    data.set('area', '0');
  }

  data.set('hasElectricity', form.elements.hasElectricity.value);
  data.set('isAvailable', form.elements.isAvailable.disabled ? 'true' : form.elements.isAvailable.value);
  data.set('isStudentHousing', 'false');
  ['hasElectricity', 'hasMotorbikeAccess', 'hasCarAccess'].forEach((field) => {
    if (form.elements[field].type === 'checkbox') {
      data.set(field, form.elements[field].checked ? 'true' : 'false');
    }
  });
  return data;
}

async function hydrateUser() {
  if (!state.token) {
    updateAuthenticatedActions();
    return;
  }

  try {
    state.user = await api('/api/auth/me', { headers: headers() });
    updateAdminVisibility();
    updateAuthenticatedActions();
    connectChatSocket();
    loadChatConversations().catch(() => {});
  } catch (_error) {
    state.token = '';
    state.user = null;
    localStorage.removeItem('maisonMadaToken');
    disconnectChatSocket();
    updateAdminVisibility();
    updateAuthenticatedActions();
  }
}

els.search.addEventListener('submit', (event) => {
  event.preventDefault();
  loadOtherListings(searchParams(), { includeFeatured: true }).catch((error) => toast(error.message));
  els.otherListings.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.querySelector('#allListingsButton').addEventListener('click', () => {
  els.search.reset();
  loadOtherListings(new URLSearchParams(), { includeFeatured: true }).catch((error) => toast(error.message));
  els.otherListings.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

els.stats.addEventListener('click', (event) => {
  const card = event.target.closest('[data-stat]');
  if (!card) return;

  const params = new URLSearchParams();
  const key = card.dataset.stat;
  if (key === 'location' || key === 'vente') params.set('dealType', key);
  if (key === 'maison' || key === 'appartement' || key === 'terrain') params.set('propertyType', key);
  loadOtherListings(params, { includeFeatured: true }).catch((error) => toast(error.message));
  els.otherListings.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

els.listings.addEventListener('click', (event) => {
  const carouselButton = event.target.closest('[data-carousel]');
  if (carouselButton) {
    const track = els.listings.querySelector('.listings-track');
    if (track) {
      const direction = carouselButton.dataset.carousel === 'next' ? 1 : -1;
      track.scrollBy({ left: direction * track.clientWidth, behavior: 'smooth' });
    }
    return;
  }

  const button = event.target.closest('[data-favorite]');
  if (!button) return;

  const id = button.dataset.favorite;
  if (state.favorites.has(id)) {
    state.favorites.delete(id);
    toast(t('toast.favoriteRemoved'));
  } else {
    state.favorites.add(id);
    toast(t('toast.favoriteAdded'));
  }
  saveFavorites();
  button.classList.toggle('active');
});

document.querySelector('#favoritesButton').addEventListener('click', async () => {
  if (!state.favorites.size) {
    toast(t('toast.noFavorites'));
    return;
  }

  await loadOtherListings(new URLSearchParams(), { includeFeatured: true });
  els.otherListings.querySelectorAll('[data-favorite]').forEach((button) => {
    if (!state.favorites.has(button.dataset.favorite)) {
      button.closest('.listing-card').remove();
    }
  });
  els.otherListings.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

els.notificationsOpenButton.addEventListener('click', () => openNotificationsFromTopbar().catch((error) => toast(error.message)));
els.notificationsQuickClose.addEventListener('click', closeNotificationsQuickPanel);
els.notificationsQuickAll.addEventListener('click', () => {
  closeNotificationsQuickPanel();
  openMember().then(openNotificationsPanel).catch((error) => toast(error.message));
});
els.chatOpenButton.addEventListener('click', () => openChatQuickPanel().catch((error) => toast(error.message)));
els.chatQuickClose.addEventListener('click', closeChatQuickPanel);
els.chatQuickAll.addEventListener('click', () => openChat().catch((error) => toast(error.message)));
els.chatQuickSearch.addEventListener('input', renderChatQuickConversations);
els.chatQuickPanel.addEventListener('click', (event) => {
  const filter = event.target.closest('[data-chat-filter]');
  if (filter) {
    state.chatQuickFilter = filter.dataset.chatFilter;
    els.chatQuickPanel.querySelectorAll('[data-chat-filter]').forEach((button) => {
      button.classList.toggle('active', button === filter);
    });
    renderChatQuickConversations();
    return;
  }

  const button = event.target.closest('[data-chat-quick]');
  if (!button) return;
  const conversation = state.chatConversations.find((item) => String(item._id) === String(button.dataset.chatQuick));
  if (!conversation) return;
  openChat()
    .then(() => openConversation(conversation))
    .catch((error) => toast(error.message));
});
els.chatCloseButton.addEventListener('click', closeChat);
els.supportChatButton.addEventListener('click', () => startSupportChat().catch((error) => toast(error.message)));
els.chatRefreshButton.addEventListener('click', () => loadChatConversations().catch((error) => toast(error.message)));
els.chatConversations.addEventListener('click', (event) => {
  const button = event.target.closest('[data-chat-conversation]');
  if (!button) return;
  const conversation = state.chatConversations.find((item) => String(item._id) === String(button.dataset.chatConversation));
  if (conversation) openConversation(conversation).catch((error) => toast(error.message));
});
els.chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!state.activeConversationId) return;

  const input = els.chatForm.elements.message;
  const body = String(input.value || '').trim();
  if (!body) return;
  input.value = '';
  connectChatSocket();
  state.socket?.emit('chat:message', { conversationId: state.activeConversationId, body }, (response) => {
    if (!response?.ok) toast(response?.message || 'Message non envoye');
    else {
      state.unreadChatConversations.delete(String(state.activeConversationId));
      renderChatUnreadState();
      renderChatConversations();
    }
  });
});

els.profileBackButton.addEventListener('click', () => {
  window.location.hash = '#listingsSection';
});

window.addEventListener('hashchange', handleRoute);

function findListingForDetail(id) {
  return [
    ...state.listingsData,
    ...state.otherListingsData,
    ...state.recentListingsData,
    ...state.profileListingsData,
    ...state.memberListingsData,
    ...state.adminListingsData
  ].find((listing) => String(listing._id) === String(id));
}

async function loadSharedListing(id) {
  try {
    const listing = findListingForDetail(id) || await api(`/api/listings/${encodeURIComponent(id)}`);
    if (listing && !findListingForDetail(listing._id)) {
      state.recentListingsData = [listing, ...state.recentListingsData];
    }
    openListingDetail(listing);
  } catch (error) {
    toast(error.message);
  }
}

document.addEventListener('click', (event) => {
  const profileLink = event.target.closest('[data-profile-link]');
  if (profileLink) {
    els.detailModal.close();
    return;
  }

  const copyButton = event.target.closest('[data-copy-reference]');
  if (copyButton) {
    event.preventDefault();
    event.stopPropagation();
    copyText(copyButton.dataset.copyReference)
      .then(() => toast(t('toast.referenceCopied')))
      .catch((error) => toast(error.message));
    return;
  }

  const share = event.target.closest('[data-share-listing]');
  if (share) {
    event.preventDefault();
    event.stopPropagation();
    const listing = findListingForDetail(share.dataset.shareListing);
    if (!listing) return;
    shareListing(listing, share.dataset.shareUrl)
      .catch((error) => {
        if (error?.name !== 'AbortError') toast(error.message);
      });
    return;
  }

  const ownerChat = event.target.closest('[data-chat-owner]');
  if (ownerChat) {
    event.preventDefault();
    event.stopPropagation();
    startDirectChat(ownerChat.dataset.chatOwner, ownerChat.dataset.chatListing)
      .catch((error) => toast(error.message));
    return;
  }

  const detailThumb = event.target.closest('.detail-thumbs img');
  if (detailThumb) {
    const mainImage = detailThumb.closest('.detail-gallery').querySelector('.detail-main-image');
    mainImage.src = detailThumb.src;
    return;
  }

  if (event.target.closest('[data-publish-open]')) {
    event.preventDefault();
    event.stopPropagation();
    openPublish();
  }

  const mapButton = event.target.closest('[data-map-location]');
  if (mapButton) {
    event.preventDefault();
    event.stopPropagation();
    openMap(
      decodeURIComponent(mapButton.dataset.mapLocation),
      decodeURIComponent(mapButton.dataset.mapUrl || ''),
      decodeURIComponent(mapButton.dataset.mapEmbedUrl || '')
    );
  }

  const detailCard = event.target.closest('[data-detail-id]');
  if (detailCard && !event.target.closest('button, a, input, select, textarea')) {
    const listing = findListingForDetail(detailCard.dataset.detailId);
    if (listing) {
      window.history.replaceState(null, '', `#listing/${listing._id}`);
      openListingDetail(listing);
    }
  }
});

document.querySelectorAll('[data-member-open]').forEach((button) => {
  button.addEventListener('click', () => openMember().catch((error) => toast(error.message)));
});

document.querySelectorAll('[data-admin-open]').forEach((button) => {
  button.addEventListener('click', () => openAdmin().catch((error) => toast(error.message)));
});

document.querySelector('[data-auth-close]').addEventListener('click', () => els.authModal.close());
document.querySelector('[data-publish-close]').addEventListener('click', () => els.publishModal.close());
document.querySelector('[data-edit-close]').addEventListener('click', () => els.editModal.close());
document.querySelector('[data-map-close]').addEventListener('click', closeMap);
document.querySelector('[data-detail-close]').addEventListener('click', () => {
  els.detailModal.close();
  if (window.location.hash.startsWith('#listing/')) {
    window.history.replaceState(null, '', '#listingsSection');
  }
});
document.querySelector('[data-member-close]').addEventListener('click', closeMember);
document.querySelector('[data-member-profile-open]').addEventListener('click', openMemberProfile);
document.querySelector('[data-member-profile-close]').addEventListener('click', closeMemberProfile);
document.querySelector('[data-member-notifications-open]').addEventListener('click', () => openNotificationsPanel().catch((error) => toast(error.message)));
document.querySelector('[data-member-notifications-close]').addEventListener('click', closeNotificationsPanel);
document.querySelector('[data-verification-close]').addEventListener('click', closeVerificationModal);
document.querySelectorAll('[data-admin-close]').forEach((button) => {
  button.addEventListener('click', closeAdmin);
});

els.menuToggle.addEventListener('click', () => {
  setMobileMenu(!document.body.classList.contains('menu-open'));
});

document.querySelectorAll('.nav a, .nav button, .top-actions button').forEach((element) => {
  element.addEventListener('click', () => {
    if (element.closest('.top-popover')) return;
    setMobileMenu(false);
  });
});

document.addEventListener('pointerdown', (event) => {
  if (!document.body.classList.contains('menu-open')) return;
  if (event.target.closest('.topbar')) return;
  setMobileMenu(false);
});

document.addEventListener('pointerdown', (event) => {
  if (event.target.closest('.top-popover') || event.target.closest('#chatOpenButton') || event.target.closest('#notificationsOpenButton')) return;
  closeChatQuickPanel();
  closeNotificationsQuickPanel();
});

[
  els.authModal,
  els.publishModal,
  els.editModal,
  els.verificationModal,
  els.detailModal
].forEach((modal) => {
  modal.addEventListener('pointerdown', (event) => {
    if (event.target === modal) modal.close();
  });
});

els.mapModal.addEventListener('pointerdown', (event) => {
  if (event.target === els.mapModal) closeMap();
});

els.memberModal.addEventListener('pointerdown', (event) => {
  if (event.target === els.memberModal) closeMember();
});

els.memberProfilePanel.addEventListener('click', (event) => {
  if (event.target.closest('[data-verification-open]')) {
    openVerificationModal();
  }
});

els.memberModal.addEventListener('pointerdown', (event) => {
  if (els.memberProfilePanel.hidden) return;
  if (event.target.closest('#memberProfilePanel')) return;
  closeMemberProfile();
});

els.adminModal.addEventListener('pointerdown', (event) => {
  if (event.target === els.adminModal) closeAdmin();
});

els.adminModal.addEventListener('pointerdown', (event) => {
  if (els.adminActivityPanel.hidden) return;
  if (event.target.closest('#adminActivityPanel')) return;
  closeAdminActivity();
});

els.adminModal.addEventListener('pointerdown', (event) => {
  if (els.adminProfilePanel.hidden) return;
  if (event.target.closest('#adminProfilePanel')) return;
  closeAdminProfile();
});

document.querySelectorAll('[data-admin-tab]').forEach((button) => {
  button.addEventListener('click', () => {
    state.adminTab = button.dataset.adminTab;
    renderAdmin();
  });
});

els.adminModal.addEventListener('click', (event) => {
  const viewButton = event.target.closest('[data-admin-view]');
  if (!viewButton) return;
  state.adminView = viewButton.dataset.adminView;
  renderAdmin();
});

els.adminListings.addEventListener('click', async (event) => {
  const featured = event.target.closest('[data-admin-featured]');
  const approve = event.target.closest('[data-admin-approve]');
  const reject = event.target.closest('[data-admin-reject]');
  const remove = event.target.closest('[data-admin-delete-listing]');

  try {
    if (featured) {
      await api(`/api/admin/listings/${featured.dataset.adminFeatured}/featured`, {
        method: 'PUT',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: featured.dataset.featured === 'true' })
      });
      toast(t('toast.featuredUpdated'));
    } else if (approve || reject) {
      const reason = reject ? await requestRejectReason() : '';
      if (reject && reason === null) return;

      await api(`/api/admin/listings/${(approve || reject).dataset.adminApprove || (approve || reject).dataset.adminReject}/moderation`, {
        method: 'PUT',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: approve ? 'approved' : 'rejected', reason })
      });
      toast(t('toast.moderated'));
    } else if (remove) {
      if (!window.confirm(t('confirm.deleteListing'))) return;
      await api(`/api/admin/listings/${remove.dataset.adminDeleteListing}`, {
        method: 'DELETE',
        headers: headers()
      });
      toast(t('toast.deleted'));
    } else {
      return;
    }

    await Promise.all([loadAdminData(), loadStats(), loadListings(), loadOtherListings(), loadRecent()]);
  } catch (error) {
    toast(error.message);
  }
});

els.adminUsers.addEventListener('click', async (event) => {
  const profileButton = event.target.closest('[data-admin-profile]');
  const activityButton = event.target.closest('[data-admin-activity]');
  const messageButton = event.target.closest('[data-admin-message]');
  const roleButton = event.target.closest('[data-admin-role]');
  const accountButton = event.target.closest('[data-admin-account]');
  const verifyButton = event.target.closest('[data-admin-verify]');
  const deleteButton = event.target.closest('[data-admin-delete-user]');
  if (!profileButton && !activityButton && !messageButton && !roleButton && !accountButton && !verifyButton && !deleteButton) return;

  try {
    if (profileButton) {
      openAdminProfile(profileButton.dataset.adminProfile);
    } else if (activityButton) {
      await openAdminActivity(activityButton.dataset.adminActivity);
    } else if (messageButton) {
      const user = state.adminUsersData.find((item) => String(item._id) === String(messageButton.dataset.adminMessage));
      const message = await requestAdminMessage(user);
      if (message === null) return;
      await api(`/api/admin/users/${messageButton.dataset.adminMessage}/notifications`, {
        method: 'POST',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      toast(t('notifications.sent'));
    } else if (roleButton) {
      await api(`/api/admin/users/${roleButton.dataset.adminRole}`, {
        method: 'PUT',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: roleButton.dataset.role })
      });
    } else if (accountButton) {
      await api(`/api/admin/users/${accountButton.dataset.adminAccount}`, {
        method: 'PUT',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountType: accountButton.dataset.accountType })
      });
    } else if (verifyButton) {
      await api(`/api/admin/users/${verifyButton.dataset.adminVerify}`, {
        method: 'PUT',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ identityVerified: verifyButton.dataset.verified === 'true' })
      });
    } else {
      if (!window.confirm(t('confirm.deleteUser'))) return;
      await api(`/api/admin/users/${deleteButton.dataset.adminDeleteUser}`, {
        method: 'DELETE',
        headers: headers()
      });
      toast(t('toast.deleted'));
    }

    await loadAdminData();
  } catch (error) {
    toast(error.message);
  }
});

document.querySelector('[data-admin-activity-close]').addEventListener('click', closeAdminActivity);
document.querySelector('[data-admin-profile-close]').addEventListener('click', closeAdminProfile);

els.adminProfilePanel.addEventListener('click', (event) => {
  const activityButton = event.target.closest('[data-admin-activity]');
  const messageButton = event.target.closest('[data-admin-message]');
  if (activityButton) {
    openAdminActivity(activityButton.dataset.adminActivity).catch((error) => toast(error.message));
    return;
  }
  if (messageButton) {
    const user = state.adminUsersData.find((item) => String(item._id) === String(messageButton.dataset.adminMessage));
    requestAdminMessage(user)
      .then((message) => {
        if (message === null) return null;
        return api(`/api/admin/users/${messageButton.dataset.adminMessage}/notifications`, {
          method: 'POST',
          headers: { ...headers(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ message })
        });
      })
      .then((result) => {
        if (result) toast(t('notifications.sent'));
      })
      .catch((error) => toast(error.message));
  }
});

document.querySelectorAll('[data-dashboard-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    state.dashboardFilter = button.dataset.dashboardFilter;
    document.querySelectorAll('[data-dashboard-filter]').forEach((item) => {
      item.classList.toggle('active', item === button);
    });
    renderMemberListings();
  });
});

document.querySelectorAll('[data-auth-mode]').forEach((button) => {
  button.addEventListener('click', () => setAuthMode(button.dataset.authMode));
});

[els.publishForm, els.editForm].forEach((form) => {
  form.elements.dealType.addEventListener('change', () => applyListingFormRules(form));
  form.elements.propertyType.addEventListener('change', () => applyListingFormRules(form));
});

els.publishForm.addEventListener('input', savePublishDraft);
els.publishForm.addEventListener('change', savePublishDraft);

els.verificationForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!state.user) return;

  els.verificationStatus.textContent = t('status.saving');
  try {
    const updatedUser = await api('/api/auth/verification', {
      method: 'POST',
      headers: headers(),
      body: new FormData(els.verificationForm)
    });
    state.user = updatedUser;
    els.verificationModal.close();
    toast(t('verify.sent'));
    openMemberProfile();
  } catch (error) {
    els.verificationStatus.textContent = error.message;
  }
});

els.authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  els.authStatus.textContent = state.authMode === 'register' ? t('status.creating') : t('status.login');

  try {
    const payload = Object.fromEntries(new FormData(els.authForm).entries());
    const session = await api(`/api/auth/${state.authMode === 'register' ? 'register' : 'login'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    disconnectChatSocket();
    resetChatState();
    state.token = session.token;
    state.user = session.user;
    localStorage.setItem('maisonMadaToken', state.token);
    window.location.reload();
    return;
  } catch (error) {
    els.authStatus.textContent = error.message;
  }
});

document.querySelector('#logoutButton').addEventListener('click', async () => {
  try {
    await api('/api/auth/logout', { method: 'POST', headers: headers() });
  } catch (_error) {
    // La session peut deja etre expiree cote serveur.
  }

  state.token = '';
  state.user = null;
  localStorage.removeItem('maisonMadaToken');
  disconnectChatSocket();
  resetChatState();
  updateAdminVisibility();
  updateAuthenticatedActions();
  window.location.reload();
});

els.publishForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!state.user) {
    openAuth('publish');
    return;
  }

  els.publishStatus.textContent = t('status.publishing');
  try {
    const body = listingFormData(els.publishForm, { requireImages: true, requireMapUrl: true });
    await api('/api/listings', {
      method: 'POST',
      headers: headers(),
      body
    });

    els.publishModal.close();
    clearPublishDraft();
    els.publishForm.reset();
    toast(state.user.role === 'admin' ? t('toast.published') : t('toast.pendingReview'));
    await Promise.all([loadStats(), loadListings(), loadOtherListings(), loadRecent()]);
    if (els.memberModal.classList.contains('is-open')) await loadMemberListings();
  } catch (error) {
    els.publishStatus.textContent = error.message;
  }
});

els.memberListings.addEventListener('click', async (event) => {
  const editButton = event.target.closest('[data-edit]');
  if (editButton) {
    const listing = state.memberListingsData.find((item) => String(item._id) === editButton.dataset.edit);
    if (!listing) return;
    if (listing.status === 'pending') {
      toast(t('listing.pendingLocked'));
      return;
    }

    state.editingListingId = String(listing._id);
    els.editStatus.textContent = '';
    els.editForm.elements.title.value = listing.title || '';
    els.editForm.elements.location.value = listing.location || '';
    els.editForm.elements.mapUrl.value = listing.mapUrl || '';
    els.editForm.elements.dealType.value = listing.dealType || 'location';
    els.editForm.elements.propertyType.value = listing.propertyType || 'maison';
    els.editForm.elements.price.value = listing.price || 0;
    els.editForm.elements.area.value = listing.area || 0;
    els.editForm.elements.bedrooms.value = listing.bedrooms || 0;
    els.editForm.elements.description.value = listing.description || '';
    els.editForm.elements.hasElectricity.value = Boolean(listing.hasElectricity) ? 'true' : 'false';
    els.editForm.elements.waterSource.value = listing.waterSource || (listing.hasTapWater === false ? 'exterieur' : 'jirama');
    els.editForm.elements.showerLocation.value = listing.showerLocation || listing.showerWcLocation || 'interieur';
    els.editForm.elements.wcLocation.value = listing.wcLocation || listing.showerWcLocation || 'interieur';
    els.editForm.elements.isAvailable.value = listing.isAvailable === false ? 'false' : 'true';
    els.editForm.elements.hasMotorbikeAccess.checked = Boolean(listing.hasMotorbikeAccess);
    els.editForm.elements.hasCarAccess.checked = Boolean(listing.hasCarAccess);
    els.editForm.elements.image.value = '';
    els.editForm.elements.video.value = '';
    applyListingFormRules(els.editForm);
    els.editModal.showModal();
    return;
  }

  const button = event.target.closest('[data-delete]');
  if (!button) return;
  if (!window.confirm(t('confirm.deleteListing'))) return;

  try {
    await api(`/api/listings/${button.dataset.delete}`, {
      method: 'DELETE',
      headers: headers()
    });
    toast(t('toast.deleted'));
    await Promise.all([loadStats(), loadListings(), loadOtherListings(), loadRecent(), loadMemberListings()]);
  } catch (error) {
    toast(error.message);
  }
});

els.editForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!state.editingListingId) return;

  els.editStatus.textContent = t('status.saving');
  try {
    const body = listingFormData(els.editForm);
    await api(`/api/listings/${state.editingListingId}`, {
      method: 'PUT',
      headers: headers(),
      body
    });

    els.editModal.close();
    state.editingListingId = null;
    toast(t('toast.updated'));
    await Promise.all([loadStats(), loadListings(), loadOtherListings(), loadRecent(), loadMemberListings()]);
  } catch (error) {
    els.editStatus.textContent = error.message;
  }
});

els.themeToggle.addEventListener('click', () => {
  const dark = document.body.classList.contains('dark-mode');
  applyTheme(dark ? 'light' : 'dark');
});

els.langToggle.addEventListener('click', async () => {
  const currentIndex = languageOrder.indexOf(state.lang);
  state.lang = languageOrder[(currentIndex + 1) % languageOrder.length];
  localStorage.setItem('maisonMadaLang', state.lang);
  translatePage();
  renderMemberListings();
  if (els.adminModal.classList.contains('is-open')) renderAdmin();
  await Promise.all([loadStats(), loadListings(), loadOtherListings(searchParams(), { includeFeatured: true }), loadRecent()]);
  handleRoute();
});

applyTheme(localStorage.getItem('maisonMadaTheme') || 'light');
translatePage();
setAuthMode('login');
updateAdminVisibility();
updateAuthenticatedActions();
hydrateUser()
  .then(() => Promise.all([loadStats(), loadListings(), loadOtherListings(), loadRecent()]))
  .then(handleRoute)
  .catch((error) => toast(error.message))
  .finally(icons);
