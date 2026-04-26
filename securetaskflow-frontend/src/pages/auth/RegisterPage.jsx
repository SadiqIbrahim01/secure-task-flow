import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, User, Eye, EyeOff, CheckCircle } from 'lucide-react';

import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

import { register as registerUser } from '../../api/auth';
import useAuthStore from '../../store/authStore';
import { registerSchema } from '../../utils/validationSchemas';

// Visual password strength indicator
function PasswordStrength({ password }) {
  if (!password) return null;

  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
    { label: 'Special character', pass: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ];

  const passed = checks.filter((c) => c.pass).length;
  const strengthColors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div className="space-y-2 mt-2">
      {/* Strength bar */}
      <div className="flex gap-1">
        {checks.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i < passed ? strengthColors[passed - 1] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${
        passed < 2 ? 'text-red-500' :
        passed < 4 ? 'text-yellow-500' : 'text-green-500'
      }`}>
        {strengthLabels[passed - 1] || 'Too weak'}
      </p>

      {/* Individual checks */}
      <div className="grid grid-cols-2 gap-1">
        {checks.map(({ label, pass }) => (
          <div key={label} className="flex items-center gap-1">
            <CheckCircle className={`h-3 w-3 ${
              pass ? 'text-green-500' : 'text-gray-300'
            }`} />
            <span className={`text-xs ${
              pass ? 'text-green-700' : 'text-gray-400'
            }`}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const loginStore = useAuthStore((s) => s.login);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(registerSchema) });

  // Watch password field for strength indicator
  const passwordValue = watch('password', '');

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError('');

    try {
      const response = await registerUser({
        email: data.email.toLowerCase(),
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });

      // Auto-login after registration
      loginStore(response.data);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const status = error.response?.status;
      const detail = error.response?.data?.detail;
      const fieldErrors = error.response?.data?.fieldErrors;

      if (status === 409) {
        setServerError('An account with this email already exists. Try logging in.');
      } else if (status === 400 && fieldErrors) {
        // Backend validation — show first field error
        const firstError = Object.values(fieldErrors)[0];
        setServerError(firstError);
      } else if (detail) {
        setServerError(detail);
      } else {
        setServerError('Something went wrong. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start managing projects securely"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

        <Alert message={serverError} type="error" />

        {/* Name row */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First name"
            type="text"
            placeholder="John"
            icon={User}
            error={errors.firstName?.message}
            autoComplete="given-name"
            required
            {...register('firstName')}
          />
          <Input
            label="Last name"
            type="text"
            placeholder="Doe"
            error={errors.lastName?.message}
            autoComplete="family-name"
            required
            {...register('lastName')}
          />
        </div>

        <Input
          label="Email address"
          type="email"
          placeholder="john@example.com"
          icon={Mail}
          error={errors.email?.message}
          autoComplete="email"
          required
          {...register('email')}
        />

        {/* Password with strength indicator */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center 
                            pointer-events-none">
              <Lock className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
              autoComplete="new-password"
              className={`input-field pl-10 pr-10 ${
                errors.password ? 'border-red-500 focus:ring-red-500' : ''
              }`}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center 
                         text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-600">⚠ {errors.password.message}</p>
          )}
          <PasswordStrength password={passwordValue} />
        </div>

        {/* Confirm password */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Confirm password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center 
                            pointer-events-none">
              <Lock className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Repeat your password"
              autoComplete="new-password"
              className={`input-field pl-10 pr-10 ${
                errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''
              }`}
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center 
                         text-gray-400 hover:text-gray-600"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-600">
              ⚠ {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Terms */}
        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
          By creating an account you agree to our terms. Your data is protected
          with BCrypt encryption and JWT authentication.
        </p>

        <Button type="submit" fullWidth loading={isLoading}>
          {isLoading ? 'Creating account...' : 'Create account'}
        </Button>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}