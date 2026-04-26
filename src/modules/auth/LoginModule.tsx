import AuthPageLayout from '@/layouts/auth/AuthPageLayout';
import LoginForm from '@/components/features/auth/LoginForm';

export default function LoginModule() {
  return (
    <AuthPageLayout>
      <LoginForm />
    </AuthPageLayout>
  );
}
