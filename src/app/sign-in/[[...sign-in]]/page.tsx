import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar Sesión — ProveedorConecta Nicaragua",
  description: "Accede a tu cuenta en ProveedorConecta, el marketplace B2B/B2C de Nicaragua.",
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#00BCD4]/10 to-[#00BCD4]/30 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            ProveedorConecta
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Marketplace B2B/B2C de Nicaragua
          </p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900",
            },
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  );
}
