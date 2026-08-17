import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function getFormattedProducts() {
    try {
        const products = await sql`
          SELECT 
            p.id, 
            p.title, 
            p.description, 
            p.price, 
            p.stock, 
            p.image, 
            p.original_price, 
            p.is_on_sale, 
            p.is_featured, 
            c.name AS category 
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
        `;

        const rows = Array.isArray(products) ? products : (products.rows || []);

        return rows.map((p) => ({
            id: String(p.id),
            name: p.title,
            title: p.title,
            description: p.description,
            price: parseFloat(p.price),
            stock: p.stock,
            category: p.category || 'General',
            brand: p.category ? p.category.toUpperCase() : 'BRAND',
            rating: 4,
            image: p.image || '/placeholder.png',
            originalPrice: p.original_price ? parseFloat(p.original_price) : parseFloat(p.price),
            isOnSale: Boolean(p.is_on_sale),
            isFeatured: Boolean(p.is_featured),
            isOutOfStock: p.stock <= 0
        }));
    } catch (error) {
        console.error("Database Fetch Error (retrying with base schema):", error);
        try {
            const fallbackProducts = await sql`
              SELECT 
                p.id, 
                p.title, 
                p.description, 
                p.price, 
                p.stock, 
                p.image, 
                c.name AS category 
              FROM products p
              LEFT JOIN categories c ON p.category_id = c.id
            `;
            const rows = Array.isArray(fallbackProducts) ? fallbackProducts : (fallbackProducts.rows || []);
            return rows.map((p) => ({
                id: String(p.id),
                name: p.title,
                title: p.title,
                description: p.description,
                price: parseFloat(p.price),
                stock: p.stock,
                category: p.category || 'General',
                brand: p.category ? p.category.toUpperCase() : 'BRAND',
                rating: 4,
                image: p.image || '/placeholder.png',
                originalPrice: parseFloat(p.price),
                isOnSale: false,
                isFeatured: false,
                isOutOfStock: p.stock <= 0
            }));
        } catch (fallbackError) {
            console.error("Fallback Database Fetch Error:", fallbackError);
            return [];
        }
    }
}

export default sql;