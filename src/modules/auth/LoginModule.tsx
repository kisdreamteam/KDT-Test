import AuthPageLayout from '@/layouts/auth/AuthPageLayout';
import AuthCard from '@/layouts/auth/AuthCard';
import AuthBackLink from '@/layouts/auth/AuthBackLink';
import LoginFeature from '@/components/features/auth/LoginFeature';

export default function LoginModule() {
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
        <LoginFeature />
      </AuthCard>
    </AuthPageLayout>
  );
}
