import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(['/admin(.*)']);

// Explicitly mark Clerk auth routes (incl. SSO/OAuth callbacks) as public
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/me/(.*)',
  '/',
]);

export default clerkMiddleware(async (auth, req) => {
  // Inject current pathname as a header so server layouts can read it
  // without a client-side hook (used to hide Navbar on /admin routes).
  const response = NextResponse.next({
    request: {
      headers: new Headers({
        ...Object.fromEntries(req.headers.entries()),
        'x-pathname': req.nextUrl.pathname,
      }),
    },
  });

  // Always allow public routes through without any auth check
  if (isPublicRoute(req)) {
    return response;
  }

  if (isAdminRoute(req)) {
    const { userId, redirectToSignIn } = await auth();

    // If not signed in, redirect to sign-in page
    if (!userId) {
      return redirectToSignIn({ returnBackUrl: req.url });
    }

    // Server layout app/admin/layout.js checks role from DB (source of truth).
  }

  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
