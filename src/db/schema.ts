import { pgTable, text, integer, boolean, timestamp, numeric, serial } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Users Table
export const users = pgTable('users', {
  uid: text('uid').primaryKey(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  licenseNumber: text('license_number'),
  profilePictureUrl: text('profile_picture_url'),
  isAdmin: boolean('is_admin').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Vehicles Table
export const vehicles = pgTable('vehicles', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  make: text('make').notNull(),
  model: text('model').notNull(),
  registrationPlate: text('registration_plate').notNull().unique(),
  color: text('color').notNull(),
  capacity: integer('capacity').notNull(), // Max passenger capacity (1-8)
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. Rides Table
export const rides = pgTable('rides', {
  id: serial('id').primaryKey(),
  driverId: text('driver_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  vehicleId: integer('vehicle_id')
    .references(() => vehicles.id, { onDelete: 'restrict' })
    .notNull(),
  pickupLocation: text('pickup_location').notNull(),
  destination: text('destination').notNull(),
  departureTime: timestamp('departure_time').notNull(),
  fare: numeric('fare', { precision: 10, scale: 2 }).notNull(),
  seatsAvailable: integer('seats_available').notNull(),
  seatsTotal: integer('seats_total').notNull(),
  status: text('status').default('SCHEDULED').notNull(), // 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. Bookings Table
export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  rideId: integer('ride_id')
    .references(() => rides.id, { onDelete: 'cascade' })
    .notNull(),
  passengerId: text('passenger_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  seatsBooked: integer('seats_booked').notNull(),
  status: text('status').default('CONFIRMED').notNull(), // 'CONFIRMED', 'CANCELLED'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. Reviews Table
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  rideId: integer('ride_id')
    .references(() => rides.id, { onDelete: 'cascade' })
    .notNull(),
  reviewerId: text('reviewer_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  revieweeId: text('reviewee_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  rating: integer('rating').notNull(), // 1 to 5
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 6. Notifications Table
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 7. Messages Table
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  rideId: integer('ride_id')
    .references(() => rides.id, { onDelete: 'cascade' })
    .notNull(),
  senderId: text('sender_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  senderName: text('sender_name').notNull(),
  senderAvatar: text('sender_avatar'),
  text: text('text').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 8. Frequent Routes Table
export const frequentRoutes = pgTable('frequent_routes', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(), // e.g. "Daily commute", "Gym", "Home to Uni"
  pickupLocation: text('pickup_location').notNull(),
  destination: text('destination').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  vehicles: many(vehicles),
  rides: many(rides),
  bookings: many(bookings),
  receivedNotifications: many(notifications),
  messages: many(messages),
  frequentRoutes: many(frequentRoutes),
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  owner: one(users, {
    fields: [vehicles.ownerId],
    references: [users.uid],
  }),
  rides: many(rides),
}));

export const ridesRelations = relations(rides, ({ one, many }) => ({
  driver: one(users, {
    fields: [rides.driverId],
    references: [users.uid],
  }),
  vehicle: one(vehicles, {
    fields: [rides.vehicleId],
    references: [vehicles.id],
  }),
  bookings: many(bookings),
  reviews: many(reviews),
  messages: many(messages),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  ride: one(rides, {
    fields: [bookings.rideId],
    references: [rides.id],
  }),
  passenger: one(users, {
    fields: [bookings.passengerId],
    references: [users.uid],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  ride: one(rides, {
    fields: [reviews.rideId],
    references: [rides.id],
  }),
  reviewer: one(users, {
    fields: [reviews.reviewerId],
    references: [users.uid],
  }),
  reviewee: one(users, {
    fields: [reviews.revieweeId],
    references: [users.uid],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.uid],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  ride: one(rides, {
    fields: [messages.rideId],
    references: [rides.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.uid],
  }),
}));

export const frequentRoutesRelations = relations(frequentRoutes, ({ one }) => ({
  user: one(users, {
    fields: [frequentRoutes.userId],
    references: [users.uid],
  }),
}));
