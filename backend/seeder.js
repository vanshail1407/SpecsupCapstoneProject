const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Frame = require('./models/Frame');
const Prescription = require('./models/Prescription');
const Reservation = require('./models/Reservation');

dotenv.config();

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/specsup';
    await mongoose.connect(mongoUri);
    console.log('[Seeder] Connected to MongoDB');
  } catch (error) {
    console.error(`[Seeder Error]: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Reservation.deleteMany();
    await Prescription.deleteMany();
    await Frame.deleteMany();
    await User.deleteMany();

    console.log('[Seeder] Existing collections destroyed.');
  } catch (error) {
    console.error(`[Seeder Destroy Error]: ${error.message}`);
    process.exit(1);
  }
};

const findOrCreateUser = async (userData) => {
  const existingUser = await User.findOne({ email: userData.email });
  return existingUser || User.create(userData);
};

const createMissingPrescriptions = async (prescriptions) => {
  for (const prescription of prescriptions) {
    const existingPrescription = await Prescription.findOne({
      customer: prescription.customer,
      checkup_date: prescription.checkup_date,
    });

    if (!existingPrescription) {
      await Prescription.create(prescription);
    }
  }
};

const importData = async () => {
  try {
    console.log('[Seeder] Seeding Admin and Customers...');

    // 1. Admin
    await findOrCreateUser({
      name: 'Shop Admin',
      email: 'admin@specsup.com',
      password: 'admin123',
      role: 'admin',
      phone: '+91 98765 43210',
      dob: '1985-05-15',
      address: 'SpecsUp Optical Shop, MG Road, Mumbai',
    });

    // 2. Customers
    const rahul = await findOrCreateUser({
      name: 'Rahul Sharma',
      email: 'rahul@gmail.com',
      password: 'password123',
      role: 'customer',
      phone: '+91 98201 11223',
      dob: '1998-04-12',
      address: 'A-402, Sunshine Heights, Andheri West, Mumbai',
    });

    const ananya = await findOrCreateUser({
      name: 'Ananya Patel',
      email: 'ananya@gmail.com',
      password: 'password123',
      role: 'customer',
      phone: '+91 98332 44556',
      dob: '1996-09-25',
      address: '12, Nilgiri Enclave, Satellite, Ahmedabad',
    });

    const vikram = await findOrCreateUser({
      name: 'Vikram Singh',
      email: 'vikram@gmail.com',
      password: 'password123',
      role: 'customer',
      phone: '+91 99110 77889',
      dob: '2001-11-03',
      address: 'Plot 55, Sector 14, Gurgaon',
    });

    const neha = await findOrCreateUser({
      name: 'Neha Gupta',
      email: 'neha@gmail.com',
      password: 'password123',
      role: 'customer',
      phone: '+91 98112 33445',
      dob: '1994-01-30',
      address: 'Flat 3B, Lakeview Apts, Koramangala, Bengaluru',
    });

    await findOrCreateUser({
      name: 'Arjun Mehta',
      email: 'arjun@gmail.com',
      password: 'password123',
      role: 'customer',
      phone: '+91 97234 56789',
      dob: '1999-07-19',
      address: 'C-14, Green Park Extension, New Delhi',
    });

    console.log('[Seeder] Seeding Prescriptions...');

    // Prescriptions for Rahul (Increasing Myopia)
    await createMissingPrescriptions([
      {
        customer: rahul._id,
        checkup_date: '2024-01-10',
        right_sph: -1.25,
        right_cyl: -0.25,
        right_axis: 90,
        right_pd: 31.5,
        left_sph: -1.50,
        left_cyl: -0.50,
        left_axis: 85,
        left_pd: 31.0,
        notes: 'Mild eye strain after screen usage. Baseline examination.',
      },
      {
        customer: rahul._id,
        checkup_date: '2025-01-15',
        right_sph: -1.50,
        right_cyl: -0.50,
        right_axis: 90,
        right_pd: 31.5,
        left_sph: -1.75,
        left_cyl: -0.50,
        left_axis: 85,
        left_pd: 31.0,
        notes: 'Complained of slight blurriness when driving at night.',
      },
      {
        customer: rahul._id,
        checkup_date: '2026-01-20',
        right_sph: -2.00,
        right_cyl: -0.75,
        right_axis: 90,
        right_pd: 32.0,
        left_sph: -2.25,
        left_cyl: -0.75,
        left_axis: 85,
        left_pd: 31.0,
        notes: 'Progressive myopic shift confirmed. Anti-glare coating prescribed.',
      },
    ]);

    // Prescriptions for Ananya (Stable)
    await createMissingPrescriptions([
      {
        customer: ananya._id,
        checkup_date: '2024-03-05',
        right_sph: -0.75,
        right_cyl: -0.25,
        right_axis: 180,
        right_pd: 30.5,
        left_sph: -0.75,
        left_cyl: -0.25,
        left_axis: 175,
        left_pd: 30.5,
        notes: 'Routine first visit. Comfortable with existing power.',
      },
      {
        customer: ananya._id,
        checkup_date: '2025-03-10',
        right_sph: -0.75,
        right_cyl: -0.25,
        right_axis: 180,
        right_pd: 30.5,
        left_sph: -0.75,
        left_cyl: -0.25,
        left_axis: 175,
        left_pd: 30.5,
        notes: 'Annual checkup. No changes in visual acuity observed.',
      },
      {
        customer: ananya._id,
        checkup_date: '2026-03-12',
        right_sph: -0.75,
        right_cyl: -0.25,
        right_axis: 180,
        right_pd: 30.5,
        left_sph: -0.75,
        left_cyl: -0.25,
        left_axis: 175,
        left_pd: 30.5,
        notes: 'Prescription remains rock-solid stable. Frame updated.',
      },
    ]);

    // Prescription for Vikram (Single baseline checkup)
    await createMissingPrescriptions([
      {
        customer: vikram._id,
        checkup_date: '2026-02-14',
        right_sph: -1.00,
        right_cyl: 0.0,
        right_axis: 0,
        right_pd: 32.0,
        left_sph: -1.00,
        left_cyl: 0.0,
        left_axis: 0,
        left_pd: 32.0,
        notes: 'Initial college checkup. Recommended follow-up in 12 months.',
      },
    ]);

    // Prescriptions for Neha (Decreasing minus / Hyperopic shift)
    await createMissingPrescriptions([
      {
        customer: neha._id,
        checkup_date: '2024-05-10',
        right_sph: -2.50,
        right_cyl: -0.50,
        right_axis: 95,
        right_pd: 31.0,
        left_sph: -2.75,
        left_cyl: -0.50,
        left_axis: 80,
        left_pd: 31.0,
        notes: 'Severe headaches from overcorrected lenses.',
      },
      {
        customer: neha._id,
        checkup_date: '2025-06-15',
        right_sph: -2.00,
        right_cyl: -0.25,
        right_axis: 95,
        right_pd: 31.0,
        left_sph: -2.25,
        left_cyl: -0.25,
        left_axis: 80,
        left_pd: 31.0,
        notes: 'Eye strain substantially reduced. Vision comfort restored.',
      },
      {
        customer: neha._id,
        checkup_date: '2026-07-20',
        right_sph: -1.75,
        right_cyl: 0.0,
        right_axis: 95,
        right_pd: 31.0,
        left_sph: -1.75,
        left_cyl: 0.0,
        left_axis: 80,
        left_pd: 31.0,
        notes: 'Lens relaxed, continuing positive visual stability.',
      },
    ]);

    console.log('[Seeder] Seeding Frames...');

    const framesData = [
      {
        name: 'Titan Classic Wayfarer',
        brand: 'Titan Eyeplus',
        price: 2499.0,
        image_url:
          'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=80',
        quantity: 4,
        description:
          'Timeless black wayfarer crafted with premium lightweight acetate for everyday durability.',
        lens_width_mm: 50.0,
        lens_height_mm: 38.0,
        bridge_width_mm: 18.0,
        frame_shape: 'Wayfarer',
        frame_material: 'Acetate',
        frame_status: 'active',
      },
      {
        name: 'Ray-Ban Clubmaster Retro',
        brand: 'Ray-Ban',
        price: 5999.0,
        image_url:
          'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80',
        quantity: 2,
        description:
          'Iconic semi-rimless browline frame in tortoiseshell and gold accents.',
        lens_width_mm: 49.0,
        lens_height_mm: 37.0,
        bridge_width_mm: 20.0,
        frame_shape: 'Browline',
        frame_material: 'Acetate & Metal',
        frame_status: 'active',
      },
      {
        name: 'Fastrack Urban Aviator',
        brand: 'Fastrack',
        price: 1899.0,
        image_url:
          'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=600&q=80',
        quantity: 5,
        description:
          'Ultra-sleek gunmetal stainless steel aviator frame with adjustable silicon nose pads.',
        lens_width_mm: 55.0,
        lens_height_mm: 48.0,
        bridge_width_mm: 14.0,
        frame_shape: 'Aviator',
        frame_material: 'Stainless Steel',
        frame_status: 'active',
      },
      {
        name: 'Vogue Chic Round',
        brand: 'Vogue Eyewear',
        price: 3499.0,
        image_url:
          'https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=600&q=80',
        quantity: 3,
        description:
          'Modern circular silhouette in polished rose gold, perfect for petite faces.',
        lens_width_mm: 48.0,
        lens_height_mm: 44.0,
        bridge_width_mm: 19.0,
        frame_shape: 'Round',
        frame_material: 'Metal',
        frame_status: 'active',
      },
      {
        name: 'Oakley Holbrook Sport',
        brand: 'Oakley',
        price: 6499.0,
        image_url:
          'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?auto=format&fit=crop&w=600&q=80',
        quantity: 1,
        description:
          'Ergonomic O-Matter stress-resistant frame built for active sports and outdoor lifestyle.',
        lens_width_mm: 54.0,
        lens_height_mm: 43.0,
        bridge_width_mm: 18.0,
        frame_shape: 'Square',
        frame_material: 'O-Matter',
        frame_status: 'active',
      },
      {
        name: 'John Jacobs Havana Square',
        brand: 'John Jacobs',
        price: 3999.0,
        image_url:
          'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=600&q=80',
        quantity: 6,
        description:
          'Rich Italian acetate frame with hand-polished bevelled edges and flexible spring hinges.',
        lens_width_mm: 51.0,
        lens_height_mm: 39.0,
        bridge_width_mm: 19.0,
        frame_shape: 'Square',
        frame_material: 'Italian Acetate',
        frame_status: 'active',
      },
      {
        name: 'Carrera Speedway Pilot',
        brand: 'Carrera',
        price: 4799.0,
        image_url:
          'https://images.unsplash.com/photo-1509695507497-903c140c43b0?auto=format&fit=crop&w=600&q=80',
        quantity: 0, // Demonstrates out-of-stock
        description:
          'Distinctive double-bridge pilot frame with Carrera signature monogram on the bridge.',
        lens_width_mm: 56.0,
        lens_height_mm: 49.0,
        bridge_width_mm: 15.0,
        frame_shape: 'Pilot',
        frame_material: 'Metal',
        frame_status: 'active',
      },
      {
        name: 'Polaroid Eco Cat-Eye',
        brand: 'Polaroid',
        price: 2799.0,
        image_url:
          'https://images.unsplash.com/photo-1582142839970-2b93cbacbe4b?auto=format&fit=crop&w=600&q=80',
        quantity: 3,
        description:
          'Sustainable bio-based polyamide cat-eye frame in translucent slate grey.',
        lens_width_mm: 52.0,
        lens_height_mm: 41.0,
        bridge_width_mm: 17.0,
        frame_shape: 'Cat-Eye',
        frame_material: 'Polyamide',
        frame_status: 'active',
      },
      {
        name: 'Heritage Unmeasured Rimless',
        brand: 'SpecsUp Heritage',
        price: 2199.0,
        image_url:
          'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=600&q=80',
        quantity: 2,
        description:
          'Classic minimal rimless frame awaiting dimensional assessment by shop optician.',
        lens_width_mm: null,
        lens_height_mm: null,
        bridge_width_mm: null,
        frame_shape: 'Rimless',
        frame_material: 'Titanium',
        frame_status: 'active',
      },
    ];

    const createdFrames = await Promise.all(
      framesData.map((frame) =>
        Frame.findOneAndUpdate(
          { name: frame.name },
          { $setOnInsert: frame },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
      )
    );

    console.log('[Seeder] Seeding Sample Reservation...');
    const sampleReservation = await Reservation.findOne({
      customer: rahul._id,
      frame: createdFrames[0]._id,
    });
    if (!sampleReservation) {
      await Reservation.create({
        customer: rahul._id,
        frame: createdFrames[0]._id,
        reservation_date: new Date(),
      });
    }

    console.log('==============================================');
    console.log('  SpecsUp MongoDB Seeded Successfully!       ');
    console.log('==============================================');
    console.log('Admin account: admin@specsup.com / admin123');
    console.log('Sample customer: rahul@gmail.com / password123 (increasing myopia)');
    console.log('Sample customer: ananya@gmail.com / password123 (stable)');
    console.log('Sample customer: vikram@gmail.com / password123 (single checkup)');
    console.log('==============================================');

    process.exit(0);
  } catch (error) {
    console.error(`[Seeder Import Error]: ${error.message}`);
    process.exit(1);
  }
};

const run = async () => {
  await connectDB();
  if (process.argv[2] === '-d') {
    await destroyData();
    process.exit(0);
  } else {
    await importData();
  }
};

run();
