import { LoginForm } from "wasp/client/auth";
import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { AuthPageLayout } from "./AuthPageLayout";

export default function Login() {
  return (
    <AuthPageLayout>
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">
          Login
        </h2>
      </div>

      <div className="
        [&_input]:appearance-none [&_input]:block [&_input]:w-full [&_input]:px-4 [&_input]:py-3 [&_input]:border-2 [&_input]:border-black [&_input]:rounded-xl [&_input]:placeholder-gray-400 [&_input]:focus:outline-none [&_input]:focus:ring-2 [&_input]:focus:ring-black [&_input]:focus:border-black [&_input]:sm:text-sm [&_input]:font-bold [&_input]:bg-transparent [&_input]:mb-4
        [&_label]:block [&_label]:text-[10px] [&_label]:font-black [&_label]:uppercase [&_label]:tracking-widest [&_label]:text-gray-500 [&_label]:mb-1.5 [&_label]:ml-1
        [&_button[type=submit]]:w-full [&_button[type=submit]]:flex [&_button[type=submit]]:justify-center [&_button[type=submit]]:py-3.5 [&_button[type=submit]]:px-4 [&_button[type=submit]]:border-2 [&_button[type=submit]]:border-black [&_button[type=submit]]:rounded-xl [&_button[type=submit]]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] [&_button[type=submit]]:text-sm [&_button[type=submit]]:font-black [&_button[type=submit]]:uppercase [&_button[type=submit]]:tracking-widest [&_button[type=submit]]:text-white [&_button[type=submit]]:bg-purple-600 [&_button[type=submit]]:hover:bg-purple-700 [&_button[type=submit]]:hover:translate-y-0.5 [&_button[type=submit]]:hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] [&_button[type=submit]]:transition-all [&_button[type=submit]]:focus:outline-none [&_button[type=submit]]:focus:ring-2 [&_button[type=submit]]:focus:ring-offset-2 [&_button[type=submit]]:focus:ring-black [&_button[type=submit]]:mt-4
        [&_a]:text-purple-600 [&_a]:underline [&_a]:font-bold
      ">
        <LoginForm />
      </div>
      <div className="mt-8 text-center space-y-4">
        <div>
          <span className="text-sm font-bold text-gray-600">
            Don't have an account yet?{" "}
            <WaspRouterLink to={routes.SignupRoute.to} className="underline text-black decoration-2 underline-offset-2 hover:text-purple-600 hover:decoration-purple-600 transition-all">
              go to signup
            </WaspRouterLink>
          </span>
        </div>
        <div>
          <span className="text-sm font-bold text-gray-600">
            Forgot your password?{" "}
            <WaspRouterLink
              to={routes.RequestPasswordResetRoute.to}
              className="underline text-black decoration-2 underline-offset-2 hover:text-purple-600 hover:decoration-purple-600 transition-all"
            >
              reset it
            </WaspRouterLink>
          </span>
        </div>
      </div>
    </AuthPageLayout>
  );
}
