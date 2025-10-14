// Middleware temporariamente desabilitado para debug
// import { withAuth } from "next-auth/middleware";

// export default withAuth(
//   function middleware() {
//     // Middleware function - pode adicionar lógica adicional aqui se necessário
//   },
//   {
//     callbacks: {
//       authorized: ({ token }) => {
//         // Retorna true se o usuário está autorizado a acessar a página
//         return !!token;
//       },
//     },
//   }
// );

// // Configurar quais rotas devem ser protegidas
// export const config = {
//   matcher: [
//     // Proteger todas as rotas exceto as de autenticação e assets
//     "/((?!api/auth|auth|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.webp$|.*\\.svg$).*)",
//   ],
// };
