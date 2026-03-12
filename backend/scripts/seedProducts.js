const mongoose = require('mongoose');
const path = require('path');
const Product = require('../models/Product');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const products = [
    // --- Large Format & Signage ---
    {
        name: 'Tarpaulin / Banner',
        category: 'Large Format',
        description: 'Durable tarpaulin printing for indoor and outdoor use.',
        basePrice: 120,
        variants: [
            { name: '2x3 ft', price: 340 },
            { name: '3x4 ft', price: 680 },
            { name: '4x6 ft', price: 1200 },
            { name: '5x8 ft', price: 2000 },
            { name: '6x10 ft', price: 3000 },
            { name: 'Custom', price: 0 }
        ],
        options: {
            sizes: ['2x3 ft', '3x4 ft', '4x6 ft', '5x8 ft', '6x10 ft', 'Custom'],
            materials: ['Standard 10oz', 'Thick 13oz', 'Blockout'],
            finishes: ['Eyelets', 'With Stand', 'Framed', 'As-Is']
        },
        image: 'https://placehold.co/600x400?text=Tarpaulin'
    },
    {
        name: 'Posters',
        category: 'Large Format',
        description: 'High-quality posters for marketing or events.',
        basePrice: 80,
        variants: [
            { name: 'A3 (11.7x16.5)', price: 180 },
            { name: 'A2 (16.5x23.4)', price: 350 },
            { name: 'A1 (23.4x33.1)', price: 550 },
            { name: 'A0 (33.1x46.8)', price: 900 },
            { name: 'Custom', price: 0 }
        ],
        options: {
            sizes: ['A3 (11.7x16.5)', 'A2 (16.5x23.4)', 'A1 (23.4x33.1)', 'A0 (33.1x46.8)', 'Custom'],
            materials: ['Glossy Paper', 'Matte Paper', 'Photo Paper'],
            finishes: ['Eyelets', 'With Stand', 'Framed', 'As-Is']
        },
        image: 'https://placehold.co/600x400?text=Posters'
    },
    {
        name: 'Vinyl Stickers',
        category: 'Large Format',
        description: 'Custom cut vinyl stickers for branding.',
        basePrice: 150,
        variants: [
            { name: 'A4 Sheet', price: 250 },
            { name: 'A3 Sheet', price: 400 },
            { name: '1x1 ft', price: 300 },
            { name: '2x2 ft', price: 800 },
            { name: '3x3 ft', price: 1500 },
            { name: 'Custom Cut', price: 0 }
        ],
        options: {
            sizes: ['A4 Sheet', 'A3 Sheet', '1x1 ft', '2x2 ft', '3x3 ft', 'Custom Cut'],
            materials: ['Glossy Vinyl', 'Matte Vinyl', 'Transparent', 'Reflective'],
            finishes: ['Eyelets', 'With Stand', 'Framed', 'As-Is']
        },
        image: 'https://placehold.co/600x400?text=Vinyl+Stickers'
    },
    {
        name: 'X-Stand Banner',
        category: 'Large Format',
        description: 'Portable X-stand banner for events.',
        basePrice: 800,
        options: {
            sizes: ['60x160 cm', '80x180 cm', '120x200 cm'],
            materials: ['Standard Vinyl', 'Premium Vinyl'],
            finishes: ['Eyelets', 'With Stand', 'Framed', 'As-Is']
        },
        image: 'https://placehold.co/600x400?text=X-Stand'
    },
    {
        name: 'Roll-up Banner',
        category: 'Large Format',
        description: 'Retractable roll-up banner with stand.',
        basePrice: 1200,
        options: {
            sizes: ['85x200 cm', '100x200 cm', '120x200 cm'],
            materials: ['Standard Vinyl', 'Premium Vinyl'],
            finishes: ['Eyelets', 'With Stand', 'Framed', 'As-Is']
        },
        image: 'https://placehold.co/600x400?text=Roll-up+Banner'
    },
    {
        name: 'Foam Board',
        category: 'Large Format',
        description: 'Lightweight foam board for displays.',
        basePrice: 250,
        options: {
            sizes: ['20x30 inch', '30x40 inch', '40x60 inch', 'Custom'],
            materials: ['3mm', '5mm', '10mm'],
            finishes: ['Eyelets', 'With Stand', 'Framed', 'As-Is']
        }
    },
    {
        name: 'Sintra Board',
        category: 'Large Format',
        description: 'Durable PVC sintra board for signs.',
        basePrice: 400,
        options: {
            sizes: ['20x30 inch', '30x40 inch', '40x60 inch', 'Custom'],
            materials: ['3mm', '5mm', '10mm']
        }
    },
    {
        name: 'Acrylic Sign',
        category: 'Large Format',
        description: 'Premium acrylic signage.',
        basePrice: 600,
        options: {
            sizes: ['12x18 inch', '18x24 inch', '24x36 inch', 'Custom'],
            materials: ['3mm Clear', '5mm Clear', '3mm Frosted']
        }
    },
    {
        name: 'Metal Sign',
        category: 'Large Format',
        description: 'Heavy-duty metal signage.',
        basePrice: 450,
        options: {
            sizes: ['12x18 inch', '18x24 inch', '24x36 inch', 'Custom'],
            materials: ['Aluminum', 'Tin/Galvanized']
        }
    },
    {
        name: 'A-Frame / Chalkboard',
        category: 'Large Format',
        basePrice: 1500,
        options: {
            sizes: ['24x36 inch', '28x44 inch'],
            materials: ['Wood Frame', 'Metal Frame']
        }
    },
    {
        name: 'Vehicle Wrap',
        category: 'Large Format',
        description: 'Custom vehicle branding.',
        basePrice: 15000,
        options: {
            sizes: ['Full Wrap', 'Partial Wrap', 'Consultation Required'],
            materials: ['3M Vinyl', 'Premium Cast']
        }
    },

    // --- Document Printing ---
    {
        name: 'Document Printing',
        category: 'Document Printing',
        basePrice: 2,
        priceRates: { 'base': 2, 'colored': 5, 'photo': 15 },
        options: {
            sizes: ['A4', 'Long (8.5x13)', 'Letter', 'Legal'],
            colors: ['Black & White (Text)', 'Colored (Graphics/Text)', 'Full Photo Quality']
        },
        image: 'https://placehold.co/600x400?text=Documents'
    },
    {
        name: 'Flyers / Leaflets',
        category: 'Document Printing',
        basePrice: 3,
        priceRates: { 'base': 3, 'colored': 8, 'photo': 20 },
        options: {
            sizes: ['A4', 'A5', 'Long', 'Letter'],
            colors: ['Black & White (Text)', 'Colored (Graphics/Text)', 'Full Photo Quality']
        }
    },
    {
        name: 'Brochures',
        category: 'Document Printing',
        basePrice: 10,
        priceRates: { 'base': 10, 'colored': 25, 'photo': 50 },
        options: {
            sizes: ['A4 Bi-fold', 'A4 Tri-fold', 'Letter Bi-fold', 'Letter Tri-fold'],
            colors: ['Black & White (Text)', 'Colored (Graphics/Text)', 'Full Photo Quality']
        }
    },
    {
        name: 'Business Cards',
        category: 'Document Printing',
        basePrice: 15, // Per sheet/set likely
        priceRates: { 'base': 15, 'colored': 30, 'photo': 40 },
        options: {
            sizes: ['Standard (3.5x2)', 'Mini (2x3.5)'],
            colors: ['Black & White (Text)', 'Colored (Graphics/Text)', 'Full Photo Quality']
        }
    },
    {
        name: 'Letterheads',
        category: 'Document Printing',
        basePrice: 5,
        priceRates: { 'base': 5, 'colored': 12, 'photo': 25 },
        options: {
            sizes: ['A4', 'Letter'],
            colors: ['Black & White (Text)', 'Colored (Graphics/Text)', 'Full Photo Quality']
        }
    },
    {
        name: 'Envelopes',
        category: 'Document Printing',
        basePrice: 8,
        priceRates: { 'base': 8, 'colored': 15, 'photo': 30 },
        options: {
            sizes: ['Long', 'A4', 'Letter'],
            colors: ['Black & White (Text)', 'Colored (Graphics/Text)', 'Full Photo Quality']
        }
    },
    {
        name: 'Carbonless Forms (NCR)',
        category: 'Document Printing',
        basePrice: 6,
        priceRates: { 'base': 6, 'colored': 15, 'photo': 30 },
        options: {
            sizes: ['A4', 'Long', 'Letter', 'Custom'],
            colors: ['Black & White (Text)', 'Colored (Graphics/Text)', 'Full Photo Quality']
        }
    },
    {
        name: 'Receipts / Invoices',
        category: 'Document Printing',
        basePrice: 4,
        priceRates: { 'base': 4, 'colored': 10, 'photo': 20 },
        options: {
            sizes: ['A5', 'Half Letter', 'Custom'],
            colors: ['Black & White (Text)', 'Colored (Graphics/Text)', 'Full Photo Quality']
        }
    },
    {
        name: 'Calendars',
        category: 'Document Printing',
        basePrice: 30,
        priceRates: { 'base': 30, 'colored': 60, 'photo': 100 },
        options: {
            sizes: ['A4 Wall', 'A3 Wall', 'Desk (Letter)'],
            colors: ['Black & White (Text)', 'Colored (Graphics/Text)', 'Full Photo Quality']
        }
    },
    {
        name: 'Certificates',
        category: 'Document Printing',
        basePrice: 8,
        priceRates: { 'base': 8, 'colored': 20, 'photo': 35 },
        options: {
            sizes: ['A4', 'Letter'],
            colors: ['Black & White (Text)', 'Colored (Graphics/Text)', 'Full Photo Quality']
        }
    },

    // --- Merchandise ---
    {
        name: 'T-Shirt (Cotton/Drifit)',
        category: 'Merchandise',
        basePrice: 250,
        options: {
            sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
            colors: ['White', 'Black', 'Navy Blue', 'Red', 'Gray', 'Other']
        },
        image: 'https://placehold.co/600x400?text=T-Shirt'
    },
    {
        name: 'Polo Shirt (Cotton)',
        category: 'Merchandise',
        basePrice: 280,
        options: {
            sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
            colors: ['White', 'Black', 'Navy Blue', 'Red', 'Gray', 'Other']
        }
    },
    {
        name: 'Hoodie / Jacket',
        category: 'Merchandise',
        basePrice: 650,
        options: {
            sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
            colors: ['White', 'Black', 'Navy Blue', 'Red', 'Gray', 'Other']
        }
    },
    {
        name: 'Ceramic Mug (11oz)',
        category: 'Merchandise',
        basePrice: 150,
        options: {
            sizes: ['Standard'],
            colors: ['White', 'Black', 'Other']
        },
        image: 'https://placehold.co/600x400?text=Mug'
    },
    {
        name: 'Magic Mug (11oz)',
        category: 'Merchandise',
        basePrice: 200,
        options: { sizes: ['Standard'], colors: ['Black (Changes on hot)'] }
    },
    {
        name: 'Tumbler (Stainless)',
        category: 'Merchandise',
        basePrice: 250,
        options: { sizes: ['500ml', '750ml', '1L'], colors: ['Silver', 'Black', 'White'] }
    },
    {
        name: 'Water Bottle (600ml)',
        category: 'Merchandise',
        basePrice: 180,
        options: { sizes: ['Standard'] }
    },
    {
        name: 'ID Lace / Lanyard',
        category: 'Merchandise',
        basePrice: 80,
        options: { sizes: ['Standard', 'Wide'] }
    },
    {
        name: 'Canvas Tote Bag',
        category: 'Merchandise',
        basePrice: 180,
        options: { sizes: ['Standard'] }
    },
    {
        name: 'Trucker Cap',
        category: 'Merchandise',
        basePrice: 200,
        options: { sizes: ['One Size'] }
    },
    {
        name: 'Button Pins',
        category: 'Merchandise',
        basePrice: 35,
        options: { sizes: ['1 inch', '1.5 inch', '2 inch'] }
    },
    {
        name: 'Keychain (Acrylic)',
        category: 'Merchandise',
        basePrice: 45,
        options: { sizes: ['Standard'] }
    },
    {
        name: 'Mouse Pad',
        category: 'Merchandise',
        basePrice: 85,
        options: { sizes: ['Standard', 'Large'] }
    },
    {
        name: 'Phone Case',
        category: 'Merchandise',
        basePrice: 180,
        options: { sizes: ['iPhone', 'Samsung', 'Generic'] }
    },

    // --- Photo Lab ---
    {
        name: 'Photo Prints',
        category: 'Photo Lab',
        basePrice: 7, // 4R default
        priceRates: { '3R (3.5x5)': 5, '4R (4x6)': 7, '5R (5x7)': 15, '8R (8x10)': 35, '11R (11x14)': 60 },
        options: {
            sizes: ['3R (3.5x5)', '4R (4x6)', '5R (5x7)', '8R (8x10)', '11R (11x14)'],
            finishes: ['Glossy', 'Matte', 'Luster'],
            layoutStyles: ['Borderless', 'With Border']
        },
        image: 'https://placehold.co/600x400?text=Photo+Prints'
    },
    {
        name: 'ID Photos',
        category: 'Photo Lab',
        basePrice: 80,
        priceRates: { '1x1 (6pcs)': 80, '2x2 (4pcs)': 80, 'Passport (2pcs)': 80, 'Mixed Package': 100 },
        options: {
            sizes: ['1x1 (6pcs)', '2x2 (4pcs)', 'Passport (2pcs)', 'Mixed Package'],
            finishes: ['Glossy', 'Matte']
        }
    },
    {
        name: 'Wallet Size',
        category: 'Photo Lab',
        basePrice: 40,
        priceRates: { 'Standard (9pcs)': 40, 'Premium (6pcs)': 60 },
        options: {
            sizes: ['Standard (9pcs)', 'Premium (6pcs)'],
            finishes: ['Glossy', 'Matte']
        }
    },
    {
        name: 'Canvas Print',
        category: 'Photo Lab',
        basePrice: 350,
        priceRates: { '8x10 inch': 350, '11x14 inch': 500, '16x20 inch': 800, '20x24 inch': 1200 },
        options: {
            sizes: ['8x10 inch', '11x14 inch', '16x20 inch', '20x24 inch'],
            finishes: ['Stretched', 'Rolled', 'Framed']
        }
    },
    {
        name: 'Photo Frame',
        category: 'Photo Lab',
        basePrice: 250,
        priceRates: { '4x6 inch': 250, '5x7 inch': 300, '8x10 inch': 450, '11x14 inch': 650 },
        options: {
            sizes: ['4x6 inch', '5x7 inch', '8x10 inch', '11x14 inch'],
            finishes: ['Wood Frame', 'Metal Frame', 'Acrylic Frame']
        }
    },
    {
        name: 'Photo Magnet',
        category: 'Photo Lab',
        basePrice: 50,
        priceRates: { '2x3 inch': 50, '4x6 inch': 80, 'Custom': 100 },
        options: {
            sizes: ['2x3 inch', '4x6 inch', 'Custom'],
            finishes: ['Flexible', 'Rigid']
        }
    },
    {
        name: 'Instax Style',
        category: 'Photo Lab',
        basePrice: 10,
        priceRates: { 'Mini (2.4x1.8)': 10, 'Square (2.4x2.4)': 12, 'Wide (3.4x4.3)': 15 },
        options: {
            sizes: ['Mini (2.4x1.8)', 'Square (2.4x2.4)', 'Wide (3.4x4.3)'],
            finishes: ['Glossy', 'Matte']
        }
    },

    // --- Events & Personal ---
    {
        name: 'Invitations',
        category: 'Events',
        description: 'Custom invitations for weddings, birthdays, debuts, and more.',
        basePrice: 8,
        options: {
            sizes: ['A5 (5.8x8.3)', 'Square (6x6)', 'DL (4.3x8.7)', 'Custom'],
            materials: ['Premium Card Stock', 'Glossy', 'Textured', 'Pearl']
        },
        image: 'https://placehold.co/600x400?text=Invitations'
    },
    {
        name: 'Greeting Cards',
        category: 'Events',
        description: 'Personalized greeting cards for any occasion.',
        basePrice: 12,
        options: {
            sizes: ['A6 (4.1x5.8)', 'Square (5x5)', 'DL (4.3x8.7)'],
            materials: ['Card Stock', 'Glossy', 'Kraft']
        }
    },
    {
        name: 'Photo Books',
        category: 'Events',
        description: 'Premium photo albums to preserve your memories.',
        basePrice: 25,
        options: {
            sizes: ['6x6 inch', '8x8 inch', '8x11 inch', '12x12 inch'],
            materials: ['Hardcover', 'Softcover', 'Layflat']
        }
    },
    {
        name: 'Event Tickets',
        category: 'Events',
        description: 'Custom printed tickets for events and admissions.',
        basePrice: 3,
        options: {
            sizes: ['2x5.5 inch', 'Custom'],
            materials: ['Card Stock', 'With Perforation']
        }
    },
    {
        name: 'Souvenirs',
        category: 'Events',
        description: 'Custom giveaways and souvenirs for guests.',
        basePrice: 15,
        options: {
            sizes: ['Keychains', 'Magnets', 'Fans', 'Bookmarks'],
            materials: ['Standard', 'Premium']
        }
    },
    {
        name: 'Paper Bags',
        category: 'Events',
        description: 'Custom printed paper bags for events and packaging.',
        basePrice: 10,
        options: {
            sizes: ['Small', 'Medium', 'Large'],
            materials: ['Kraft', 'Art Paper', 'With Handle']
        }
    },
    {
        name: 'Gift Tags',
        category: 'Events',
        description: 'Custom gift tags and labels.',
        basePrice: 4,
        options: {
            sizes: ['2x3.5 inch', '2.5x3.5 inch', 'Custom'],
            materials: ['Card Stock', 'Kraft', 'With String']
        }
    },
    {
        name: 'Acrylic Standees',
        category: 'Events',
        description: 'Custom acrylic standees for display or souvenirs.',
        basePrice: 150,
        options: {
            sizes: ['4 inch', '6 inch', '8 inch', '10 inch'],
            materials: ['3mm Clear', '5mm Clear']
        }
    },
    {
        name: 'Medals / Trophies',
        category: 'Events',
        description: 'Custom medals and trophies for awards and events.',
        basePrice: 200,
        options: {
            sizes: ['Small', 'Medium', 'Large', 'Custom'],
            materials: ['Metal', 'Acrylic', 'Resin']
        }
    },
    {
        name: 'Sash',
        category: 'Events',
        description: 'Custom printed sashes for graduations, pageants, birthdays, and events.',
        basePrice: 120,
        options: {
            sizes: ['Standard', 'Wide'],
            materials: ['Satin', 'Polyester']
        }
    },
    {
        name: 'Garland',
        category: 'Events',
        description: 'Custom printed garlands and banners for parties and celebrations.',
        basePrice: 80,
        options: {
            sizes: ['Small (3ft)', 'Medium (5ft)', 'Large (8ft)', 'Custom'],
            materials: ['Card Stock', 'Glossy Paper', 'Fabric']
        }
    },
    {
        name: 'Ref Magnet',
        category: 'Events',
        description: 'Customized refrigerator magnets for giveaways and souvenirs.',
        basePrice: 50,
        options: {
            sizes: ['ATM Size', 'Square (2.5x2.5)', 'Die-cut/Custom'],
            materials: ['Glossy', 'Matte', 'Glitter']
        }
    }
];

const seedProducts = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mjprint';
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        await Product.deleteMany({});
        console.log('Cleared existing products');

        const productsWithActive = products.map(p => ({ ...p, isActive: true }));
        await Product.insertMany(productsWithActive);
        console.log(`Seeded ${products.length} products`);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedProducts();
