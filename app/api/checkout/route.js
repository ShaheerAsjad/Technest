import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. Please log in to place an order.' }, { status: 401 });
    }

    const { name, phone, address, city, cartItems, totalAmount } = await request.json();

    if (!name || !phone || !address || !cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'Missing required fields or empty cart' }, { status: 400 });
    }

    // Ensure orders table exists and has user_id column
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255),
        customer_name VARCHAR(255),
        phone VARCHAR(100),
        address TEXT,
        city VARCHAR(100),
        items JSONB,
        total_amount NUMERIC(10, 2),
        payment_method VARCHAR(100) DEFAULT 'Cash on Delivery',
        status VARCHAR(100) DEFAULT 'Order Placed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    try {
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);`;
    } catch (e) {
      // Column exists or alter statement ignored
    }

    // 1. Transaction Start
    await sql`BEGIN`;

    // 2. Insert Order with user_id
    const orderResult = await sql`
      INSERT INTO orders (user_id, customer_name, phone, address, city, items, total_amount, payment_method, status)
      VALUES (${userId}, ${name}, ${phone}, ${address}, ${city}, ${JSON.stringify(cartItems)}, ${totalAmount}, 'Cash on Delivery', 'Order Placed')
      RETURNING id;
    `;
    const orderRows = Array.isArray(orderResult) ? orderResult : (orderResult.rows || []);
    const orderId = orderRows[0]?.id;

    // 3. Stock Deduction loop with availability check
    for (const item of cartItems) {
      const productId = item.id;
      const quantity = item.quantity || 1;

      // Stock check: Kya product available hai?
      const productResult = await sql`SELECT stock FROM products WHERE id = ${productId}`;
      const productRows = Array.isArray(productResult) ? productResult : (productResult.rows || []);

      if (!productRows || productRows.length === 0) {
        throw new Error(`Product not found (ID: ${productId})`);
      }

      const currentStock = productRows[0].stock;
      if (currentStock < quantity) {
        throw new Error(`Insufficient stock for ${item.name || 'item'}. Available: ${currentStock}, Requested: ${quantity}`);
      }

      // Stock update
      await sql`
        UPDATE products 
        SET stock = stock - ${quantity} 
        WHERE id = ${productId}
      `;
    }

    // 4. Commit (Save changes)
    await sql`COMMIT`;

    return NextResponse.json({ success: true, message: 'Order placed and stock updated successfully!', orderId });

  } catch (error) {
    // Agar koi error aya toh changes cancel
    try {
      await sql`ROLLBACK`;
    } catch (rollbackErr) {
      console.error('Rollback Error:', rollbackErr);
    }
    console.error('Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
