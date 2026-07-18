export const JWT_SECRET = process.env.JWT_SECRET || '';
export const JWT_EXPIRES_IN = '24h';

export const servicesMessagePatterns = {
  CREATE: 'services.create',
  FIND_ALL: 'services.findAll',
  FIND_ONE: 'services.findOne',
  UPDATE: 'services.update',
  REMOVE: 'services.remove',
  FIND_BY_STYLIST: 'services.findByStylist',
};

export const stylistsMessagePatterns = {
  CREATE: 'stylists.create',
  FIND_ALL: 'stylists.findAll',
  FIND_ONE: 'stylists.findOne',
  UPDATE: 'stylists.update',
  REMOVE: 'stylists.remove',
};

export const invoicesMessagePatterns = {
  CREATE: 'invoices.create',
  FIND_ONE: 'invoices.findOne',
};

export const appointmentsMessagePatterns = {
  CREATE: 'appointments.create',
  FIND_ALL: 'appointments.findAll',
  FIND_ONE: 'appointments.findOne',
  UPDATE_STATUS: 'appointments.updateStatus',
  CHECK_AVAILABILITY: 'appointments.checkAvailability',
  RESCHEDULE: 'appointments.reschedule',
  CANCEL: 'appointments.cancel',
  GET_BY_STYLIST: 'appointments.getByStylist',
  GET_BY_CLIENT: 'appointments.getByClient',
  GET_AVAILABLE_SLOTS: 'appointments.getAvailableSlots',
};

export const inventoryMessagePatterns = {
  CREATE: 'inventory.create',
  FIND_ALL: 'inventory.findAll',
  FIND_ONE: 'inventory.findOne',
  UPDATE: 'inventory.update',
  REMOVE: 'inventory.remove',
  ADJUST_STOCK: 'inventory.adjustStock',
  GET_LOW_STOCK: 'inventory.getLowStock',
  CONSUME: 'inventory.consume',
};
