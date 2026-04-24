import LoginHeader from './LoginHeader';
import LoginForm from './LoginForm';
import LoginFooter from './LoginFooter';
import AuthPageLayout from '@/components/layout/auth/AuthPageLayout';
import AuthCard from '@/components/layout/auth/AuthCard';
import AuthBackLink from '@/components/layout/auth/AuthBackLink';

export default function LoginApp() {
  return (
    <AuthPageLayout>
      <AuthBackLink
        className="text-gray-300 flex-shrink-0"
        style={{
          left: 'max(calc(50% - 400px - 48px), 24px)',
          top: 'calc(50% - 220px)',
        }}
        strokeWidth={3}
      />
      <AuthCard className="w-full max-w-[800px] px-8 py-10">
        <LoginHeader />
        <LoginForm />
        <LoginFooter />
      </AuthCard>
    </AuthPageLayout>
  );
}

