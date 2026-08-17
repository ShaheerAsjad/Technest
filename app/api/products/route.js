import { NextResponse } from 'next/server';
import { getFormattedProducts } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const products = await getFormattedProducts();
        return NextResponse.json(products);
    } catch (error) {
        console.error("API Route Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch products", details: error.message },
            { status: 500 }
        );
    }
}