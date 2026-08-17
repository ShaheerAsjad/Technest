import Hero from '@/components/Hero';
import Categories from '@/components/Categories';
import ProductCard from '@/components/ProductCard';
import sql from '@/lib/db';

export default async function HomePage() {
  // Neon PostgreSQL se products data fetch ho raha hai
  let products = [];
  try {
    products = await sql`
      SELECT 
        products.id, 
        products.title, 
        products.description, 
        products.price, 
        products.stock, 
        products.image, 
        categories.name AS category 
      FROM products 
      LEFT JOIN categories ON products.category_id = categories.id
    `;
  } catch (error) {
    console.error("Database Fetch Error:", error);
  }

  // DB products ko ProductCard ke format mein convert karo
  const featured = products.map((p) => ({
    id: p.id,
    name: p.title,
    description: p.description,
    price: parseFloat(p.price),
    stock: p.stock,
    category: p.category || 'General',
    rating: 4, // Default rating 
    image: p.image || '/placeholder.png', // DB se image dynamic le raha hai
  }));

  return (
    <>
      <Hero />
      <Categories />
      <section className="featured">
        <h2 className="section-title">Featured Products</h2>
        {featured.length === 0 ? (
          <p>No products found in database.</p>
        ) : (
          <div className="product-grid">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}