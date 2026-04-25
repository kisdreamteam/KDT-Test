import SignupAvatar from './SignupAvatar';
import SignupForm from './SignupForm';
import AuthPageLayout from '@/layouts/auth/AuthPageLayout';
import AuthCard from '@/layouts/auth/AuthCard';
import AuthBackLink from '@/layouts/auth/AuthBackLink';

export default function SignupApp() {
  return (
    <AuthPageLayout>
      <AuthBackLink className="top-6 left-6" />
      <div className="w-full max-w-7xl flex items-center gap-8">
        <SignupAvatar />
        
        {/* Form Card on Right */}
        <AuthCard className="w-full lg:w-[600px] p-8 sm:p-10">
          <SignupForm />
        </AuthCard>
      </div>
    </AuthPageLayout>
  );
}

