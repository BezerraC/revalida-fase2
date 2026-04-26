import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const authRoutes = ['/login', '/register'];
const publicRoutes = ['/', '/acesso-restrito'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Se o usuário está tentando acessar uma rota de autenticação (login/registro) 
  // e já tem um token, redireciona para a home.
  if (authRoutes.some(route => pathname.startsWith(route)) && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Se a rota for pública, permite acesso liberado (como a Landing Page na raiz)
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Se NÃO for uma rota de autenticação e NÃO houver token, redireciona para login.
  if (!authRoutes.some(route => pathname.startsWith(route)) && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
