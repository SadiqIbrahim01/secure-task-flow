
import { ShieldCheck } from 'lucide-react';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 
                    to-primary-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo + Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 
                          rounded-2xl bg-white/20 backdrop-blur-sm mb-4">
            <ShieldCheck className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            SecureTaskFlow
          </h1>
          <p className="text-primary-200 mt-1 text-sm">
            Production-grade project management
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {subtitle && (
              <p className="text-gray-500 mt-1 text-sm">{subtitle}</p>
            )}
          </div>
          {children}
        </div>

        <p className="text-center text-primary-300 text-xs mt-6">
          Secured with JWT + BCrypt · OWASP Top 10 protected
        </p>
      </div>
    </div>
  );
}