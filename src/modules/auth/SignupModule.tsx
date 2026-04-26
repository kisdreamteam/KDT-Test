import AuthPageLayout from '@/layouts/auth/AuthPageLayout';
import SignupForm from '@/components/features/auth/SignupForm';

export default function SignupModule() {
  return (
    <AuthPageLayout>
      <SignupForm />
    </AuthPageLayout>
  );
}
