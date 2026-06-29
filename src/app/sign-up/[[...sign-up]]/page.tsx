import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear Cuenta — ProveedorConecta Nicaragua",
  description: "Regístrate en ProveedorConecta, el marketplace B2B/B2C para emprendedores nicaragüenses.",
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#00BCD4]/10 to-[#00BCD4]/30 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            ProveedorConecta
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Crea tu cuenta gratis en el marketplace de Nicaragua
          </p>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900",
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  );
}
