import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { eq, and, or, ilike, desc, sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

// Import our database client and schema
import { db } from './src/db/index.ts';
import { users, vehicles, rides, bookings, reviews, notifications, messages } from './src/db/schema.ts';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser } from './src/db/users.ts';

dotenv.config();

let currentFilename: string;
let currentDirname: string;

try {
  currentFilename = __filename;
  currentDirname = __dirname;
} catch {
  currentFilename = fileURLToPath(import.meta.url);
  currentDirname = path.dirname(currentFilename);
}

const app = express();
app.use(express.json());

export default app;

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Auth: Sync Firebase Auth user to relational database
  app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid, email, name } = req.user;
      const user = await getOrCreateUser(uid, email || '', name || 'User');
      
      // Calculate average rating
      const userReviews = await db.select({
        rating: reviews.rating,
      }).from(reviews).where(eq(reviews.revieweeId, uid));

      const reviewCount = userReviews.length;
      const averageRating = reviewCount > 0
        ? userReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : 0;

      res.status(200).json({ 
        success: true, 
        data: {
          ...user,
          averageRating: parseFloat(averageRating.toFixed(1)),
          reviewCount,
        }
      });
    } catch (error: any) {
      console.error('Error syncing user:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // User Profile: GET
  app.get('/api/profile', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user.uid;
      const userResults = await db.select().from(users).where(eq(users.uid, uid));
      if (userResults.length === 0) {
        return res.status(404).json({ success: false, error: 'Profile not found.' });
      }

      // Calculate average rating
      const userReviews = await db.select({
        rating: reviews.rating,
      }).from(reviews).where(eq(reviews.revieweeId, uid));

      const reviewCount = userReviews.length;
      const averageRating = reviewCount > 0
        ? userReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : 0;

      res.status(200).json({ 
        success: true, 
        data: {
          ...userResults[0],
          averageRating: parseFloat(averageRating.toFixed(1)),
          reviewCount,
        } 
      });
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // User Profile: PUT
  app.put('/api/profile', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user.uid;
      const { name, phone, licenseNumber, profilePictureUrl } = req.body;

      const updatedUser = await db.update(users)
        .set({
          name: name ?? undefined,
          phone: phone ?? null,
          licenseNumber: licenseNumber ?? null,
          profilePictureUrl: profilePictureUrl ?? null,
        })
        .where(eq(users.uid, uid))
        .returning();

      res.status(200).json({ success: true, data: updatedUser[0] });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Vehicles: GET User's Registered Vehicles
  app.get('/api/vehicles', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user.uid;
      const userVehicles = await db.select().from(vehicles).where(eq(vehicles.ownerId, uid));
      res.status(200).json({ success: true, data: userVehicles });
    } catch (error: any) {
      console.error('Error fetching vehicles:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Vehicles: POST Register a New Vehicle
  app.post('/api/vehicles', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user.uid;
      const { make, model, registrationPlate, color, capacity } = req.body;

      if (!make || !model || !registrationPlate || !color || !capacity) {
        return res.status(400).json({ success: false, error: 'All vehicle fields are required.' });
      }

      const newVehicle = await db.insert(vehicles)
        .values({
          ownerId: uid,
          make,
          model,
          registrationPlate,
          color,
          capacity: parseInt(capacity, 10),
        })
        .returning();

      res.status(201).json({ success: true, data: newVehicle[0] });
    } catch (error: any) {
      console.error('Error creating vehicle:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Rides: GET list or Search
  app.get('/api/rides', async (req, res) => {
    try {
      const { pickup, destination, date } = req.query;

      let queryBuilder = db.select({
        id: rides.id,
        driverId: rides.driverId,
        pickupLocation: rides.pickupLocation,
        destination: rides.destination,
        departureTime: rides.departureTime,
        fare: rides.fare,
        seatsAvailable: rides.seatsAvailable,
        seatsTotal: rides.seatsTotal,
        status: rides.status,
        driverName: users.name,
        driverAvatar: users.profilePictureUrl,
        driverPhone: users.phone,
        vehicleMake: vehicles.make,
        vehicleModel: vehicles.model,
        vehiclePlate: vehicles.registrationPlate,
        vehicleColor: vehicles.color,
      })
      .from(rides)
      .innerJoin(users, eq(rides.driverId, users.uid))
      .innerJoin(vehicles, eq(rides.vehicleId, vehicles.id));

      const conditions = [eq(rides.status, 'SCHEDULED')];

      if (pickup && typeof pickup === 'string' && pickup.trim() !== '') {
        conditions.push(ilike(rides.pickupLocation, `%${pickup}%`));
      }

      if (destination && typeof destination === 'string' && destination.trim() !== '') {
        conditions.push(ilike(rides.destination, `%${destination}%`));
      }

      if (date && typeof date === 'string' && date.trim() !== '') {
        // Filter rides starting on the given date (UTC / Local day bounds)
        const dateStart = new Date(date);
        dateStart.setHours(0, 0, 0, 0);
        const dateEnd = new Date(date);
        dateEnd.setHours(23, 59, 59, 999);
        conditions.push(and(
          sql`${rides.departureTime} >= ${dateStart}`,
          sql`${rides.departureTime} <= ${dateEnd}`
        ) as any);
      }

      const finalRides = await queryBuilder.where(and(...conditions)).orderBy(rides.departureTime);

      // Get all reviews to calculate driver average ratings
      const allReviews = await db.select({
        revieweeId: reviews.revieweeId,
        rating: reviews.rating,
      }).from(reviews);

      const driverRatingsMap: Record<string, { total: number; count: number }> = {};
      allReviews.forEach(r => {
        if (!driverRatingsMap[r.revieweeId]) {
          driverRatingsMap[r.revieweeId] = { total: 0, count: 0 };
        }
        driverRatingsMap[r.revieweeId].total += r.rating;
        driverRatingsMap[r.revieweeId].count += 1;
      });

      const ridesWithRatings = finalRides.map(ride => {
        const ratingInfo = driverRatingsMap[ride.driverId];
        return {
          ...ride,
          driverAverageRating: ratingInfo ? parseFloat((ratingInfo.total / ratingInfo.count).toFixed(1)) : 5.0,
          driverReviewCount: ratingInfo ? ratingInfo.count : 0,
        };
      });

      res.status(200).json({ success: true, data: ridesWithRatings });
    } catch (error: any) {
      console.error('Error fetching rides:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Rides: GET Driver's Offered Rides
  app.get('/api/rides/driver', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user.uid;
      const driverRides = await db.select({
        id: rides.id,
        pickupLocation: rides.pickupLocation,
        destination: rides.destination,
        departureTime: rides.departureTime,
        fare: rides.fare,
        seatsAvailable: rides.seatsAvailable,
        seatsTotal: rides.seatsTotal,
        status: rides.status,
      })
      .from(rides)
      .where(eq(rides.driverId, uid))
      .orderBy(desc(rides.departureTime));

      res.status(200).json({ success: true, data: driverRides });
    } catch (error: any) {
      console.error('Error fetching driver rides:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Rides: POST Create a Ride
  app.post('/api/rides', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user.uid;
      const { vehicleId, pickupLocation, destination, departureTime, fare, seatsTotal } = req.body;

      if (!vehicleId || !pickupLocation || !destination || !departureTime || !fare || !seatsTotal) {
        return res.status(400).json({ success: false, error: 'All ride details are required.' });
      }

      // Verify vehicle exists and belongs to the user
      const userVehicles = await db.select().from(vehicles).where(and(eq(vehicles.id, vehicleId), eq(vehicles.ownerId, uid)));
      if (userVehicles.length === 0) {
        return res.status(400).json({ success: false, error: 'Vehicle not found or does not belong to you.' });
      }

      const newRide = await db.insert(rides)
        .values({
          driverId: uid,
          vehicleId: parseInt(vehicleId, 10),
          pickupLocation,
          destination,
          departureTime: new Date(departureTime),
          fare: fare.toString(),
          seatsAvailable: parseInt(seatsTotal, 10),
          seatsTotal: parseInt(seatsTotal, 10),
          status: 'SCHEDULED',
        })
        .returning();

      res.status(201).json({ success: true, data: newRide[0] });
    } catch (error: any) {
      console.error('Error creating ride:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Rides: GET single Ride details + Reviews
  app.get('/api/rides/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const rideResults = await db.select({
        id: rides.id,
        driverId: rides.driverId,
        pickupLocation: rides.pickupLocation,
        destination: rides.destination,
        departureTime: rides.departureTime,
        fare: rides.fare,
        seatsAvailable: rides.seatsAvailable,
        seatsTotal: rides.seatsTotal,
        status: rides.status,
        driverName: users.name,
        driverAvatar: users.profilePictureUrl,
        driverPhone: users.phone,
        driverLicense: users.licenseNumber,
        vehicleMake: vehicles.make,
        vehicleModel: vehicles.model,
        vehiclePlate: vehicles.registrationPlate,
        vehicleColor: vehicles.color,
      })
      .from(rides)
      .innerJoin(users, eq(rides.driverId, users.uid))
      .innerJoin(vehicles, eq(rides.vehicleId, vehicles.id))
      .where(eq(rides.id, id));

      if (rideResults.length === 0) {
        return res.status(404).json({ success: false, error: 'Ride not found.' });
      }

      // Fetch reviews for this driver
      const driverUid = rideResults[0].driverId;
      const driverReviews = await db.select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        reviewerName: users.name,
        reviewerAvatar: users.profilePictureUrl,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.reviewerId, users.uid))
      .where(eq(reviews.revieweeId, driverUid))
      .orderBy(desc(reviews.createdAt));

      // Fetch bookings on this ride for driver overview or context
      const rideBookings = await db.select({
        id: bookings.id,
        seatsBooked: bookings.seatsBooked,
        status: bookings.status,
        passengerName: users.name,
        passengerAvatar: users.profilePictureUrl,
        passengerPhone: users.phone,
        passengerId: bookings.passengerId,
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.passengerId, users.uid))
      .where(eq(bookings.rideId, id));

      res.status(200).json({
        success: true,
        data: {
          ride: rideResults[0],
          reviews: driverReviews,
          bookings: rideBookings,
        },
      });
    } catch (error: any) {
      console.error('Error fetching ride details:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Rides: UPDATE ride status or cancel ride
  app.put('/api/rides/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const uid = req.user.uid;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ success: false, error: 'Status is required.' });
      }

      // Verify user owns the ride
      const rideResults = await db.select().from(rides).where(and(eq(rides.id, id), eq(rides.driverId, uid)));
      if (rideResults.length === 0) {
        return res.status(403).json({ success: false, error: 'Unauthorized or ride not found.' });
      }

      const updatedRide = await db.update(rides)
        .set({ status })
        .where(eq(rides.id, id))
        .returning();

      // If ride cancelled, notify all passengers
      if (status === 'CANCELLED') {
        const bookedPassengers = await db.select()
          .from(bookings)
          .where(and(eq(bookings.rideId, id), eq(bookings.status, 'CONFIRMED')));

        for (const booking of bookedPassengers) {
          // Mark booking as cancelled
          await db.update(bookings).set({ status: 'CANCELLED' }).where(eq(bookings.id, booking.id));

          // Create notification
          await db.insert(notifications).values({
            userId: booking.passengerId,
            title: 'Ride Cancelled',
            message: `Your ride from ${rideResults[0].pickupLocation} to ${rideResults[0].destination} was cancelled by the driver.`,
          });
        }
      } else if (status === 'COMPLETED' || status === 'ACTIVE') {
        const bookedPassengers = await db.select()
          .from(bookings)
          .where(and(eq(bookings.rideId, id), eq(bookings.status, 'CONFIRMED')));

        for (const booking of bookedPassengers) {
          await db.insert(notifications).values({
            userId: booking.passengerId,
            title: status === 'ACTIVE' ? 'Ride Started' : 'Ride Completed',
            message: `Your ride from ${rideResults[0].pickupLocation} to ${rideResults[0].destination} has ${status === 'ACTIVE' ? 'started' : 'been completed'}.`,
          });
        }
      }

      res.status(200).json({ success: true, data: updatedRide[0] });
    } catch (error: any) {
      console.error('Error updating ride:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Bookings: POST Create booking (claim seats)
  app.post('/api/bookings', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user.uid;
      const { rideId, seatsBooked } = req.body;

      if (!rideId || !seatsBooked || parseInt(seatsBooked, 10) <= 0) {
        return res.status(400).json({ success: false, error: 'Invalid booking requests.' });
      }

      const rideIdNum = parseInt(rideId, 10);
      const seatsRequested = parseInt(seatsBooked, 10);

      // Fetch the ride
      const rideResults = await db.select().from(rides).where(eq(rides.id, rideIdNum));
      if (rideResults.length === 0) {
        return res.status(404).json({ success: false, error: 'Ride not found.' });
      }

      const ride = rideResults[0];

      if (ride.driverId === uid) {
        return res.status(400).json({ success: false, error: 'Drivers cannot book seats on their own rides.' });
      }

      if (ride.status !== 'SCHEDULED') {
        return res.status(400).json({ success: false, error: 'Ride is no longer open for booking.' });
      }

      if (ride.seatsAvailable < seatsRequested) {
        return res.status(400).json({ success: false, error: 'Not enough available seats on this ride.' });
      }

      // Check if user already has an active or pending booking on this ride
      const existingBookings = await db.select().from(bookings).where(
        and(
          eq(bookings.rideId, rideIdNum),
          eq(bookings.passengerId, uid)
        )
      );

      const hasActiveBooking = existingBookings.some(b => b.status === 'PENDING' || b.status === 'CONFIRMED');
      if (hasActiveBooking) {
        return res.status(400).json({ success: false, error: 'You already have an active or pending booking request for this ride.' });
      }

      // Create booking with status 'PENDING'
      const newBooking = await db.insert(bookings)
        .values({
          rideId: rideIdNum,
          passengerId: uid,
          seatsBooked: seatsRequested,
          status: 'PENDING',
        })
        .returning();

      // Notify Driver
      const passengerUser = await db.select().from(users).where(eq(users.uid, uid));
      const passengerName = passengerUser[0]?.name || 'A passenger';

      await db.insert(notifications).values({
        userId: ride.driverId,
        title: 'New Booking Request',
        message: `${passengerName} requested ${seatsRequested} seat(s) on your ride from ${ride.pickupLocation} to ${ride.destination}.`,
      });

      res.status(201).json({ success: true, data: newBooking[0] });
    } catch (error: any) {
      console.error('Error booking ride:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Bookings: GET Passenger's Booking History
  app.get('/api/bookings', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user.uid;
      const history = await db.select({
        id: bookings.id,
        seatsBooked: bookings.seatsBooked,
        status: bookings.status,
        createdAt: bookings.createdAt,
        rideId: rides.id,
        pickupLocation: rides.pickupLocation,
        destination: rides.destination,
        departureTime: rides.departureTime,
        fare: rides.fare,
        rideStatus: rides.status,
        driverName: users.name,
        driverAvatar: users.profilePictureUrl,
        driverPhone: users.phone,
        driverId: rides.driverId,
      })
      .from(bookings)
      .innerJoin(rides, eq(bookings.rideId, rides.id))
      .innerJoin(users, eq(rides.driverId, users.uid))
      .where(eq(bookings.passengerId, uid))
      .orderBy(desc(bookings.createdAt));

      // Get all reviews written by this user
      const userWrittenReviews = await db.select({
        rideId: reviews.rideId,
      })
      .from(reviews)
      .where(eq(reviews.reviewerId, uid));

      const reviewedRidesSet = new Set(userWrittenReviews.map(r => r.rideId));

      const historyWithReviewStatus = history.map(booking => ({
        ...booking,
        alreadyReviewed: reviewedRidesSet.has(booking.rideId),
      }));

      res.status(200).json({ success: true, data: historyWithReviewStatus });
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Bookings: CANCEL booking
  app.post('/api/bookings/:id/cancel', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const uid = req.user.uid;

      const bookingResults = await db.select().from(bookings).where(and(eq(bookings.id, id), eq(bookings.passengerId, uid)));
      if (bookingResults.length === 0) {
        return res.status(404).json({ success: false, error: 'Booking not found.' });
      }

      const booking = bookingResults[0];
      if (booking.status === 'CANCELLED') {
        return res.status(400).json({ success: false, error: 'Booking is already cancelled.' });
      }

      const originalStatus = booking.status;

      // Update booking status
      const updatedBooking = await db.update(bookings)
        .set({ status: 'CANCELLED' })
        .where(eq(bookings.id, id))
        .returning();

      // Return seats to ride ONLY if the booking was CONFIRMED
      if (originalStatus === 'CONFIRMED') {
        const rideResults = await db.select().from(rides).where(eq(rides.id, booking.rideId));
        if (rideResults.length > 0) {
          const ride = rideResults[0];
          await db.update(rides)
            .set({ seatsAvailable: Math.min(ride.seatsTotal, ride.seatsAvailable + booking.seatsBooked) })
            .where(eq(rides.id, ride.id));

          // Notify Driver
          const passengerUser = await db.select().from(users).where(eq(users.uid, uid));
          const passengerName = passengerUser[0]?.name || 'A passenger';

          await db.insert(notifications).values({
            userId: ride.driverId,
            title: 'Booking Cancelled',
            message: `${passengerName} cancelled their booking of ${booking.seatsBooked} seat(s) on your ride from ${ride.pickupLocation} to ${ride.destination}.`,
          });
        }
      } else {
        // Just notify driver that a pending request was withdrawn
        const rideResults = await db.select().from(rides).where(eq(rides.id, booking.rideId));
        if (rideResults.length > 0) {
          const ride = rideResults[0];
          const passengerUser = await db.select().from(users).where(eq(users.uid, uid));
          const passengerName = passengerUser[0]?.name || 'A passenger';

          await db.insert(notifications).values({
            userId: ride.driverId,
            title: 'Booking Request Withdrawn',
            message: `${passengerName} withdrew their booking request of ${booking.seatsBooked} seat(s) on your ride from ${ride.pickupLocation} to ${ride.destination}.`,
          });
        }
      }

      res.status(200).json({ success: true, data: updatedBooking[0] });
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Bookings: ACCEPT pending booking request (Driver only)
  app.post('/api/bookings/:id/accept', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const uid = req.user.uid;

      // Find booking
      const bookingResults = await db.select().from(bookings).where(eq(bookings.id, id));
      if (bookingResults.length === 0) {
        return res.status(404).json({ success: false, error: 'Booking request not found.' });
      }

      const booking = bookingResults[0];

      // Fetch the associated ride
      const rideResults = await db.select().from(rides).where(eq(rides.id, booking.rideId));
      if (rideResults.length === 0) {
        return res.status(404).json({ success: false, error: 'Associated ride not found.' });
      }

      const ride = rideResults[0];

      // Verify the current user is the driver
      if (ride.driverId !== uid) {
        return res.status(403).json({ success: false, error: 'Unauthorized. Only the ride driver can approve bookings.' });
      }

      // Check current status
      if (booking.status !== 'PENDING') {
        return res.status(400).json({ success: false, error: `Booking cannot be approved because it is in status: ${booking.status}` });
      }

      // Verify seats are still available
      if (ride.seatsAvailable < booking.seatsBooked) {
        return res.status(400).json({ success: false, error: 'Not enough seats available on your ride to fulfill this booking request.' });
      }

      // Update booking to CONFIRMED
      const updatedBooking = await db.update(bookings)
        .set({ status: 'CONFIRMED' })
        .where(eq(bookings.id, id))
        .returning();

      // Decrement seatsAvailable on ride
      await db.update(rides)
        .set({ seatsAvailable: ride.seatsAvailable - booking.seatsBooked })
        .where(eq(rides.id, ride.id));

      // Notify the passenger
      const driverUser = await db.select().from(users).where(eq(users.uid, uid));
      const driverName = driverUser[0]?.name || 'Your driver';

      await db.insert(notifications).values({
        userId: booking.passengerId,
        title: 'Booking Request Accepted!',
        message: `${driverName} accepted your booking of ${booking.seatsBooked} seat(s) on the ride from ${ride.pickupLocation} to ${ride.destination}. Contact details are now accessible in your booking history.`,
      });

      res.status(200).json({ success: true, data: updatedBooking[0] });
    } catch (error: any) {
      console.error('Error accepting booking:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Bookings: REJECT pending booking request (Driver only)
  app.post('/api/bookings/:id/reject', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const uid = req.user.uid;

      // Find booking
      const bookingResults = await db.select().from(bookings).where(eq(bookings.id, id));
      if (bookingResults.length === 0) {
        return res.status(404).json({ success: false, error: 'Booking request not found.' });
      }

      const booking = bookingResults[0];

      // Fetch the associated ride
      const rideResults = await db.select().from(rides).where(eq(rides.id, booking.rideId));
      if (rideResults.length === 0) {
        return res.status(404).json({ success: false, error: 'Associated ride not found.' });
      }

      const ride = rideResults[0];

      // Verify current user is driver
      if (ride.driverId !== uid) {
        return res.status(403).json({ success: false, error: 'Unauthorized. Only the ride driver can reject bookings.' });
      }

      // Check current status
      if (booking.status !== 'PENDING') {
        return res.status(400).json({ success: false, error: `Booking cannot be rejected because it is in status: ${booking.status}` });
      }

      // Update booking to REJECTED
      const updatedBooking = await db.update(bookings)
        .set({ status: 'REJECTED' })
        .where(eq(bookings.id, id))
        .returning();

      // Notify the passenger
      const driverUser = await db.select().from(users).where(eq(users.uid, uid));
      const driverName = driverUser[0]?.name || 'Your driver';

      await db.insert(notifications).values({
        userId: booking.passengerId,
        title: 'Booking Request Declined',
        message: `Your booking request for ${booking.seatsBooked} seat(s) on the ride from ${ride.pickupLocation} to ${ride.destination} has been declined by driver ${driverName}.`,
      });

      res.status(200).json({ success: true, data: updatedBooking[0] });
    } catch (error: any) {
      console.error('Error rejecting booking:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Reviews: POST Leave Review
  app.post('/api/reviews', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user.uid;
      const { rideId, revieweeId, rating, comment } = req.body;

      if (!rideId || !revieweeId || !rating) {
        return res.status(400).json({ success: false, error: 'Ride ID, recipient, and rating are required.' });
      }

      const newReview = await db.insert(reviews)
        .values({
          rideId: parseInt(rideId, 10),
          reviewerId: uid,
          revieweeId,
          rating: parseInt(rating, 10),
          comment: comment || null,
        })
        .returning();

      // Notify reviewee
      const reviewerUser = await db.select().from(users).where(eq(users.uid, uid));
      const reviewerName = reviewerUser[0]?.name || 'Another user';

      await db.insert(notifications).values({
        userId: revieweeId,
        title: 'New Review Received',
        message: `${reviewerName} gave you a ${rating}-star rating! Comment: "${comment || 'No comment left'}"`,
      });

      res.status(201).json({ success: true, data: newReview[0] });
    } catch (error: any) {
      console.error('Error creating review:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Notifications: GET notifications for user
  app.get('/api/notifications', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user.uid;
      const unreadNotifications = await db.select()
        .from(notifications)
        .where(eq(notifications.userId, uid))
        .orderBy(desc(notifications.createdAt));

      res.status(200).json({ success: true, data: unreadNotifications });
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Notifications: Mark as read
  app.post('/api/notifications/:id/read', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const uid = req.user.uid;

      await db.update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.id, id), eq(notifications.userId, uid)));

      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error reading notification:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // --- MESSAGES API ROUTES ---

  // Messages: GET
  app.get('/api/rides/:id/messages', requireAuth, async (req: AuthRequest, res) => {
    try {
      const rideId = parseInt(req.params.id, 10);
      const uid = req.user.uid;

      // 1. Fetch ride details
      const rideResults = await db.select().from(rides).where(eq(rides.id, rideId));
      if (rideResults.length === 0) {
        return res.status(404).json({ success: false, error: 'Ride not found.' });
      }

      const ride = rideResults[0];

      // 2. Check if user is the driver
      const isDriver = ride.driverId === uid;

      // 3. Check if user has a confirmed booking
      const userBooking = await db.select()
        .from(bookings)
        .where(and(eq(bookings.rideId, rideId), eq(bookings.passengerId, uid), eq(bookings.status, 'CONFIRMED')));

      const isPassenger = userBooking.length > 0;

      if (!isDriver && !isPassenger) {
        return res.status(403).json({ success: false, error: 'Unauthorized. You are not a participant in this ride.' });
      }

      // 4. Fetch all messages
      const rideMessages = await db.select()
        .from(messages)
        .where(eq(messages.rideId, rideId))
        .orderBy(messages.createdAt);

      res.status(200).json({ success: true, data: rideMessages });
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Messages: POST
  app.post('/api/rides/:id/messages', requireAuth, async (req: AuthRequest, res) => {
    try {
      const rideId = parseInt(req.params.id, 10);
      const uid = req.user.uid;
      const { text } = req.body;

      if (!text || text.trim() === '') {
        return res.status(400).json({ success: false, error: 'Message text is required.' });
      }

      // 1. Fetch ride details
      const rideResults = await db.select().from(rides).where(eq(rides.id, rideId));
      if (rideResults.length === 0) {
        return res.status(404).json({ success: false, error: 'Ride not found.' });
      }

      const ride = rideResults[0];

      // 2. Check if user is driver or passenger
      const isDriver = ride.driverId === uid;
      const userBooking = await db.select()
        .from(bookings)
        .where(and(eq(bookings.rideId, rideId), eq(bookings.passengerId, uid), eq(bookings.status, 'CONFIRMED')));

      const isPassenger = userBooking.length > 0;

      if (!isDriver && !isPassenger) {
        return res.status(403).json({ success: false, error: 'Unauthorized. You are not a participant in this ride.' });
      }

      // 3. Get sender details
      const senderUser = await db.select().from(users).where(eq(users.uid, uid));
      const senderName = senderUser[0]?.name || 'User';
      const senderAvatar = senderUser[0]?.profilePictureUrl || '';

      // 4. Insert message
      const newMessage = await db.insert(messages)
        .values({
          rideId,
          senderId: uid,
          senderName,
          senderAvatar,
          text,
        })
        .returning();

      res.status(201).json({ success: true, data: newMessage[0] });
    } catch (error: any) {
      console.error('Error creating message:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Admin: Get Platform Stats
  app.get('/api/admin/stats', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user.uid;

      // Verify user is admin
      const adminUser = await db.select().from(users).where(and(eq(users.uid, uid), eq(users.isAdmin, true)));
      if (adminUser.length === 0) {
        return res.status(403).json({ success: false, error: 'Access denied. Administrator privileges required.' });
      }

      // Query database statistics
      const totalUsersResult = await db.select({ count: sql`count(*)` }).from(users);
      const totalRidesResult = await db.select({ count: sql`count(*)` }).from(rides);
      const totalBookingsResult = await db.select({ count: sql`count(*)` }).from(bookings);
      const activeRidesResult = await db.select({ count: sql`count(*)` }).from(rides).where(eq(rides.status, 'SCHEDULED'));

      res.status(200).json({
        success: true,
        data: {
          totalUsers: parseInt(totalUsersResult[0]?.count as string || '0', 10),
          totalRides: parseInt(totalRidesResult[0]?.count as string || '0', 10),
          totalBookings: parseInt(totalBookingsResult[0]?.count as string || '0', 10),
          activeRides: parseInt(activeRidesResult[0]?.count as string || '0', 10),
        },
      });
    } catch (error: any) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Admin: Get All Users
  app.get('/api/admin/users', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user.uid;
      const adminUser = await db.select().from(users).where(and(eq(users.uid, uid), eq(users.isAdmin, true)));
      if (adminUser.length === 0) {
        return res.status(403).json({ success: false, error: 'Access denied.' });
      }

      const allUsersList = await db.select().from(users).orderBy(desc(users.createdAt));
      res.status(200).json({ success: true, data: allUsersList });
    } catch (error: any) {
      console.error('Error fetching users admin:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Admin: Toggle Admin Privileges
  app.post('/api/admin/users/:uid/toggle-admin', requireAuth, async (req: AuthRequest, res) => {
    try {
      const adminUid = req.user.uid;
      const targetUid = req.params.uid;

      const adminUser = await db.select().from(users).where(and(eq(users.uid, adminUid), eq(users.isAdmin, true)));
      if (adminUser.length === 0) {
        return res.status(403).json({ success: false, error: 'Access denied.' });
      }

      const targetUser = await db.select().from(users).where(eq(users.uid, targetUid));
      if (targetUser.length === 0) {
        return res.status(404).json({ success: false, error: 'User not found.' });
      }

      const updated = await db.update(users)
        .set({ isAdmin: !targetUser[0].isAdmin })
        .where(eq(users.uid, targetUid))
        .returning();

      res.status(200).json({ success: true, data: updated[0] });
    } catch (error: any) {
      console.error('Error toggling admin privilege:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Admin: Get All Rides
  app.get('/api/admin/rides', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user.uid;
      const adminUser = await db.select().from(users).where(and(eq(users.uid, uid), eq(users.isAdmin, true)));
      if (adminUser.length === 0) {
        return res.status(403).json({ success: false, error: 'Access denied.' });
      }

      const allRidesList = await db.select({
        id: rides.id,
        pickupLocation: rides.pickupLocation,
        destination: rides.destination,
        departureTime: rides.departureTime,
        fare: rides.fare,
        seatsAvailable: rides.seatsAvailable,
        seatsTotal: rides.seatsTotal,
        status: rides.status,
        driverName: users.name,
        driverEmail: users.email,
      })
      .from(rides)
      .innerJoin(users, eq(rides.driverId, users.uid))
      .orderBy(desc(rides.createdAt));

      res.status(200).json({ success: true, data: allRidesList });
    } catch (error: any) {
      console.error('Error fetching admin rides:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // --- VITE MIDDLEWARE SETUP ---

async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RideLink server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}
