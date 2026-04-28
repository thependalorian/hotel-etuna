import React from 'react';
import { RegisterForm } from '@/components/features/auth/RegisterForm';
import Link from 'next/link';

const RegisterPage = () => {
  return (
    <div className="flex min-h-screen flex-col justify-center items-center px-6 py-12 lg:px-8 bg-gradient-to-br from-base-200 via-base-100 to-base-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in">
        {/* Logo/Brand (Halo Effect - Beauty = Trust) */}
        <div className="flex justify-center mb-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-nude-600 via-nude-500 to-nude-400 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-nude-600 to-nude-500 flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
              <span className="text-3xl font-bold text-white">H</span>
            </div>
          </div>
        </div>
        
        {/* Headline (Von Restorff - standout messaging) */}
        <h2 className="text-center text-3xl md:text-4xl font-bold font-display leading-tight tracking-tight text-base-content mb-3">
          Create Your Account
        </h2>
        <p className="text-center text-base md:text-lg text-base-content/70 leading-relaxed mb-2">
          Start managing your hospitality business today
        </p>
        <p className="text-center text-sm md:text-base text-base-content/60">
          Get instant access to complete property management • No credit card required
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="card bg-base-100 shadow-xl card-hover">
          <div className="card-body p-8 md:p-10">
            <RegisterForm />
          </div>
        </div>

        <p className="mt-8 text-center text-sm md:text-base text-base-content/70">
          Already a member?{' '}
          <Link 
            href="/login" 
            className="font-semibold leading-6 text-primary hover:text-primary/80 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 rounded-sm"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;